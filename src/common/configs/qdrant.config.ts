import { QdrantClient } from "@qdrant/js-client-rest";
import { env } from "@/common/utils/envConfig";

let qdrantClient: QdrantClient | null = null;

/**
 * Get or create the Qdrant client singleton
 */
export function getQdrantClient(): QdrantClient {
	if (!qdrantClient) {
		qdrantClient = new QdrantClient({
			host: env.QDRANT_HOST,
			port: env.QDRANT_PORT,
			...(env.QDRANT_API_KEY ? { apiKey: env.QDRANT_API_KEY } : {}),
		});
	}
	return qdrantClient;
}

export const QDRANT_COLLECTION = "learning_documents";
