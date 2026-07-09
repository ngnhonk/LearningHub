import { logger } from "@/server";
import type {
	AICompletionOptions,
	AICompletionResponse,
	AIEmbeddingResponse,
	AIMessage,
	IAIProvider,
} from "../ai-provider.interface";
import { env } from "@/common/utils/envConfig";

export class OpenRouterProvider implements IAIProvider {
	readonly name = "openrouter";
	private readonly apiKey: string;
	private readonly baseUrl = "https://openrouter.ai/api/v1";
	private readonly defaultModel: string;
	private readonly embeddingModel: string;
	private readonly embeddingDimensions: number;

	constructor() {
		this.apiKey = env.OPENROUTER_API_KEY;
		this.defaultModel = env.AI_DEFAULT_MODEL;
		this.embeddingModel = env.EMBEDDING_MODEL;
		this.embeddingDimensions = env.EMBEDDING_DIMENSIONS;

		if (!this.apiKey) {
			logger.warn("OpenRouter API key is not configured");
		}
	}

	async generateCompletion(
		messages: AIMessage[],
		options?: AICompletionOptions,
	): Promise<AICompletionResponse> {
		const model = options?.model || this.defaultModel;

		const body: Record<string, unknown> = {
			model,
			messages,
			temperature: options?.temperature ?? 0.7,
			max_tokens: options?.max_tokens ?? 4096,
			top_p: options?.top_p ?? 1,
		};

		if (options?.response_format) {
			body.response_format = options.response_format;
		}

		const response = await fetch(`${this.baseUrl}/chat/completions`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				"Content-Type": "application/json",
				"HTTP-Referer": "https://learninghub.app",
				"X-Title": "LearningHub",
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const errorBody = await response.text();
			throw new Error(
				`OpenRouter API error (${response.status}): ${errorBody}`,
			);
		}

		const data = await response.json();
		const choice = data.choices?.[0];

		if (!choice) {
			throw new Error("OpenRouter returned no choices");
		}

		return {
			content: choice.message?.content || "",
			model: data.model || model,
			usage: data.usage
				? {
						prompt_tokens: data.usage.prompt_tokens,
						completion_tokens: data.usage.completion_tokens,
						total_tokens: data.usage.total_tokens,
					}
				: undefined,
			finish_reason: choice.finish_reason,
		};
	}

	async generateEmbedding(text: string): Promise<AIEmbeddingResponse> {
		const response = await fetch(`${this.baseUrl}/embeddings`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				"Content-Type": "application/json",
				"HTTP-Referer": "https://learninghub.app",
				"X-Title": "LearningHub",
			},
			body: JSON.stringify({
				model: this.embeddingModel,
				input: text,
			}),
		});

		if (!response.ok) {
			const errorBody = await response.text();
			throw new Error(
				`OpenRouter Embedding API error (${response.status}): ${errorBody}`,
			);
		}

		const data = await response.json();
		const embedding = data.data?.[0]?.embedding;

		if (!embedding) {
			throw new Error("OpenRouter returned no embedding data");
		}

		return {
			embedding,
			model: this.embeddingModel,
			dimensions: this.embeddingDimensions,
		};
	}
}
