import { v7 as uuidv7 } from "uuid";
import { logger } from "@/server";
import { getQdrantClient, QDRANT_COLLECTION } from "@/common/configs/qdrant.config";
import { createAIProvider } from "./ai-provider.factory";
import { env } from "@/common/utils/envConfig";

export interface DocumentPayload {
	content: string;
	source_type: "document" | "question" | "textbook";
	subject_id?: string;
	metadata?: Record<string, unknown>;
}

export interface SearchResult {
	id: string;
	score: number;
	content: string;
	source_type: string;
	subject_id?: string;
	metadata?: Record<string, unknown>;
}

export class VectorStoreService {
	/**
	 * Initialize the Qdrant collection if it doesn't exist
	 */
	async initializeCollection(): Promise<void> {
		const client = getQdrantClient();

		try {
			const collections = await client.getCollections();
			const exists = collections.collections.some(
				(c) => c.name === QDRANT_COLLECTION,
			);

			if (!exists) {
				await client.createCollection(QDRANT_COLLECTION, {
					vectors: {
						size: env.EMBEDDING_DIMENSIONS,
						distance: "Cosine",
					},
				});

				// Create payload indexes for filtering
				await client.createPayloadIndex(QDRANT_COLLECTION, {
					field_name: "subject_id",
					field_schema: "keyword",
				});

				await client.createPayloadIndex(QDRANT_COLLECTION, {
					field_name: "source_type",
					field_schema: "keyword",
				});

				logger.info(
					`Created Qdrant collection: ${QDRANT_COLLECTION} (dims=${env.EMBEDDING_DIMENSIONS})`,
				);
			}
		} catch (error) {
			logger.error(
				`Failed to initialize Qdrant collection: ${(error as Error).message}`,
			);
			throw error;
		}
	}

	/**
	 * Upsert documents into the vector store
	 */
	async upsertDocuments(
		documents: DocumentPayload[],
	): Promise<{ upserted: number }> {
		const client = getQdrantClient();
		const provider = createAIProvider();

		const points = [];

		for (const doc of documents) {
			const embeddingResult = await provider.generateEmbedding(doc.content);

			points.push({
				id: uuidv7(),
				vector: embeddingResult.embedding,
				payload: {
					content: doc.content,
					source_type: doc.source_type,
					subject_id: doc.subject_id || "",
					metadata: doc.metadata || {},
					indexed_at: new Date().toISOString(),
				},
			});
		}

		if (points.length > 0) {
			// Batch upsert in chunks of 100
			const batchSize = 100;
			for (let i = 0; i < points.length; i += batchSize) {
				const batch = points.slice(i, i + batchSize);
				await client.upsert(QDRANT_COLLECTION, {
					wait: true,
					points: batch,
				});
			}
		}

		logger.info(
			`Upserted ${points.length} documents into Qdrant`,
		);

		return { upserted: points.length };
	}

	/**
	 * Search for similar documents using a text query
	 */
	async searchSimilar(
		query: string,
		topK = 5,
		filters?: {
			subject_id?: string;
			source_type?: string;
		},
	): Promise<SearchResult[]> {
		const client = getQdrantClient();
		const provider = createAIProvider();

		// Generate embedding for the query
		const embeddingResult = await provider.generateEmbedding(query);

		// Build filter conditions
		const must: Record<string, unknown>[] = [];
		if (filters?.subject_id) {
			must.push({
				key: "subject_id",
				match: { value: filters.subject_id },
			});
		}
		if (filters?.source_type) {
			must.push({
				key: "source_type",
				match: { value: filters.source_type },
			});
		}

		const results = await client.search(QDRANT_COLLECTION, {
			vector: embeddingResult.embedding,
			limit: topK,
			with_payload: true,
			...(must.length > 0 ? { filter: { must } } : {}),
		});

		return results.map((result) => ({
			id: String(result.id),
			score: result.score,
			content: (result.payload?.content as string) || "",
			source_type: (result.payload?.source_type as string) || "",
			subject_id: (result.payload?.subject_id as string) || undefined,
			metadata:
				(result.payload?.metadata as Record<string, unknown>) ||
				undefined,
		}));
	}

	/**
	 * Delete all documents by source ID or subject ID
	 */
	async deleteBySubjectId(subjectId: string): Promise<void> {
		const client = getQdrantClient();

		await client.delete(QDRANT_COLLECTION, {
			filter: {
				must: [
					{
						key: "subject_id",
						match: { value: subjectId },
					},
				],
			},
		});

		logger.info(
			`Deleted documents for subject_id=${subjectId} from Qdrant`,
		);
	}

	/**
	 * Get collection info (for health check / status)
	 */
	async getCollectionInfo(): Promise<{
		vectors_count: number;
		status: string;
	}> {
		const client = getQdrantClient();

		try {
			const info = await client.getCollection(QDRANT_COLLECTION);
			return {
				vectors_count: (info.points_count ?? 0) as number,
				status: info.status,
			};
		} catch {
			return { vectors_count: 0, status: "not_initialized" };
		}
	}
}

export const vectorStoreService = new VectorStoreService();
