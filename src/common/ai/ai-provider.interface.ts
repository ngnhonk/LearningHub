/**
 * AI Provider Abstraction Layer
 * Common interfaces and types for all AI providers (OpenRouter, Ollama, NVIDIA NIM)
 */

export interface AIMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

export interface AICompletionOptions {
	model?: string;
	temperature?: number;
	max_tokens?: number;
	top_p?: number;
	response_format?: { type: "json_object" | "text" };
}

export interface AICompletionResponse {
	content: string;
	model: string;
	usage?: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
	finish_reason?: string;
}

export interface AIEmbeddingResponse {
	embedding: number[];
	model: string;
	dimensions: number;
}

export interface IAIProvider {
	readonly name: string;

	/**
	 * Generate a chat completion from the LLM
	 */
	generateCompletion(
		messages: AIMessage[],
		options?: AICompletionOptions,
	): Promise<AICompletionResponse>;

	/**
	 * Generate an embedding vector for the given text
	 */
	generateEmbedding(text: string): Promise<AIEmbeddingResponse>;
}
