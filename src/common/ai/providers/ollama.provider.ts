import { logger } from "@/server";
import type {
	AICompletionOptions,
	AICompletionResponse,
	AIEmbeddingResponse,
	AIMessage,
	IAIProvider,
} from "../ai-provider.interface";
import { env } from "@/common/utils/envConfig";

export class OllamaProvider implements IAIProvider {
	readonly name = "ollama";
	private readonly baseUrl: string;
	private readonly defaultModel: string;
	private readonly embedModel: string;

	constructor() {
		this.baseUrl = env.OLLAMA_BASE_URL;
		this.defaultModel = env.OLLAMA_MODEL;
		this.embedModel = env.OLLAMA_EMBED_MODEL;
	}

	async generateCompletion(
		messages: AIMessage[],
		options?: AICompletionOptions,
	): Promise<AICompletionResponse> {
		const model = options?.model || this.defaultModel;

		const body: Record<string, unknown> = {
			model,
			messages,
			stream: false,
			options: {
				temperature: options?.temperature ?? 0.7,
				num_predict: options?.max_tokens ?? 4096,
				top_p: options?.top_p ?? 1,
			},
		};

		if (options?.response_format?.type === "json_object") {
			body.format = "json";
		}

		const response = await fetch(`${this.baseUrl}/api/chat`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const errorBody = await response.text();
			throw new Error(
				`Ollama API error (${response.status}): ${errorBody}`,
			);
		}

		const data = await response.json();

		return {
			content: data.message?.content || "",
			model: data.model || model,
			usage: data.prompt_eval_count
				? {
						prompt_tokens: data.prompt_eval_count || 0,
						completion_tokens: data.eval_count || 0,
						total_tokens:
							(data.prompt_eval_count || 0) +
							(data.eval_count || 0),
					}
				: undefined,
			finish_reason: data.done ? "stop" : "length",
		};
	}

	async generateEmbedding(text: string): Promise<AIEmbeddingResponse> {
		const response = await fetch(`${this.baseUrl}/api/embeddings`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				model: this.embedModel,
				prompt: text,
			}),
		});

		if (!response.ok) {
			const errorBody = await response.text();
			throw new Error(
				`Ollama Embedding API error (${response.status}): ${errorBody}`,
			);
		}

		const data = await response.json();
		const embedding = data.embedding;

		if (!embedding) {
			throw new Error("Ollama returned no embedding data");
		}

		return {
			embedding,
			model: this.embedModel,
			dimensions: embedding.length,
		};
	}
}
