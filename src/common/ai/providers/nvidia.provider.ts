import { logger } from "@/server";
import type {
	AICompletionOptions,
	AICompletionResponse,
	AIEmbeddingResponse,
	AIMessage,
	IAIProvider,
} from "../ai-provider.interface";
import { env } from "@/common/utils/envConfig";

export class NvidiaProvider implements IAIProvider {
	readonly name = "nvidia";
	private readonly apiKey: string;
	private readonly baseUrl = "https://integrate.api.nvidia.com/v1";
	private readonly defaultModel: string;
	private readonly embeddingModel: string;
	private readonly embeddingDimensions: number;

	constructor() {
		this.apiKey = env.NVIDIA_API_KEY;
		this.defaultModel = env.NVIDIA_MODEL;
		// NVIDIA NIM uses its own embedding models
		this.embeddingModel = env.EMBEDDING_MODEL;
		this.embeddingDimensions = env.EMBEDDING_DIMENSIONS;

		if (!this.apiKey) {
			logger.warn("NVIDIA API key is not configured");
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
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const errorBody = await response.text();
			throw new Error(
				`NVIDIA API error (${response.status}): ${errorBody}`,
			);
		}

		const data = await response.json();
		const choice = data.choices?.[0];

		if (!choice) {
			throw new Error("NVIDIA returned no choices");
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
		// NVIDIA NIM uses the same OpenAI-compatible embedding endpoint
		const response = await fetch(`${this.baseUrl}/embeddings`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: this.embeddingModel,
				input: text,
				input_type: "query",
			}),
		});

		if (!response.ok) {
			const errorBody = await response.text();
			throw new Error(
				`NVIDIA Embedding API error (${response.status}): ${errorBody}`,
			);
		}

		const data = await response.json();
		const embedding = data.data?.[0]?.embedding;

		if (!embedding) {
			throw new Error("NVIDIA returned no embedding data");
		}

		return {
			embedding,
			model: this.embeddingModel,
			dimensions: this.embeddingDimensions,
		};
	}
}
