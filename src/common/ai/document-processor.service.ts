import { logger } from "@/server";
import type { DocumentPayload } from "./vector-store.service";

export interface ChunkOptions {
	chunkSize?: number; // target chars per chunk (~500-1000 tokens ≈ 2000-4000 chars)
	chunkOverlap?: number; // overlap between chunks in chars
}

export interface ProcessedChunk {
	content: string;
	index: number;
	metadata: Record<string, unknown>;
}

const DEFAULT_CHUNK_SIZE = 2000;
const DEFAULT_CHUNK_OVERLAP = 200;

export class DocumentProcessorService {
	/**
	 * Process a markdown document into chunks suitable for embedding
	 */
	processMarkdown(
		text: string,
		subjectId: string,
		options?: ChunkOptions & { sourceFilename?: string },
	): DocumentPayload[] {
		const chunks = this.chunkByMarkdownSections(text, options);

		return chunks.map((chunk) => ({
			content: chunk.content,
			source_type: "document" as const,
			subject_id: subjectId,
			metadata: {
				...chunk.metadata,
				source_filename: options?.sourceFilename || "unknown",
				chunk_index: chunk.index,
			},
		}));
	}

	/**
	 * Smart chunking: first split by markdown headings, then by size
	 */
	private chunkByMarkdownSections(
		text: string,
		options?: ChunkOptions,
	): ProcessedChunk[] {
		const chunkSize = options?.chunkSize || DEFAULT_CHUNK_SIZE;
		const chunkOverlap = options?.chunkOverlap || DEFAULT_CHUNK_OVERLAP;

		// Split by markdown headings (## or ###)
		const sectionRegex = /^(#{1,4})\s+(.+)$/gm;
		const sections: { heading: string; level: number; content: string; startIndex: number }[] = [];

		let lastIndex = 0;
		let match: RegExpExecArray | null;

		// biome-ignore lint/suspicious/noAssignInExpressions: intentional regex exec loop
		while ((match = sectionRegex.exec(text)) !== null) {
			if (sections.length > 0) {
				sections[sections.length - 1].content = text
					.slice(lastIndex, match.index)
					.trim();
			} else if (match.index > 0) {
				// Text before the first heading
				sections.push({
					heading: "Introduction",
					level: 0,
					content: text.slice(0, match.index).trim(),
					startIndex: 0,
				});
			}

			sections.push({
				heading: match[2].trim(),
				level: match[1].length,
				content: "",
				startIndex: match.index,
			});

			lastIndex = match.index + match[0].length;
		}

		// Handle remaining content
		if (sections.length > 0) {
			sections[sections.length - 1].content = text
				.slice(lastIndex)
				.trim();
		} else {
			// No headings found — treat entire text as one section
			sections.push({
				heading: "Content",
				level: 0,
				content: text.trim(),
				startIndex: 0,
			});
		}

		// Now split large sections into smaller chunks
		const chunks: ProcessedChunk[] = [];
		let chunkIndex = 0;

		for (const section of sections) {
			if (!section.content) continue;

			const fullContent = section.heading
				? `${section.heading}\n\n${section.content}`
				: section.content;

			if (fullContent.length <= chunkSize) {
				chunks.push({
					content: fullContent,
					index: chunkIndex++,
					metadata: {
						section_heading: section.heading,
						section_level: section.level,
					},
				});
			} else {
				// Split large section by paragraphs, then merge
				const subChunks = this.chunkBySize(
					fullContent,
					chunkSize,
					chunkOverlap,
				);
				for (const sub of subChunks) {
					chunks.push({
						content: sub,
						index: chunkIndex++,
						metadata: {
							section_heading: section.heading,
							section_level: section.level,
						},
					});
				}
			}
		}

		logger.info(
			`Processed document into ${chunks.length} chunks`,
		);
		return chunks;
	}

	/**
	 * Simple size-based chunking with overlap
	 */
	private chunkBySize(
		text: string,
		chunkSize: number,
		overlap: number,
	): string[] {
		const chunks: string[] = [];
		const paragraphs = text.split(/\n\s*\n/);
		let currentChunk = "";

		for (const paragraph of paragraphs) {
			const trimmed = paragraph.trim();
			if (!trimmed) continue;

			if (
				currentChunk.length + trimmed.length + 2 > chunkSize &&
				currentChunk.length > 0
			) {
				chunks.push(currentChunk.trim());

				// Keep overlap from end of current chunk
				if (overlap > 0) {
					const overlapText = currentChunk.slice(-overlap);
					currentChunk = overlapText + "\n\n" + trimmed;
				} else {
					currentChunk = trimmed;
				}
			} else {
				currentChunk += (currentChunk ? "\n\n" : "") + trimmed;
			}
		}

		if (currentChunk.trim()) {
			chunks.push(currentChunk.trim());
		}

		return chunks;
	}
}

export const documentProcessorService = new DocumentProcessorService();
