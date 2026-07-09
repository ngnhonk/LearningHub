import type { IAIProvider } from "./ai-provider.interface";
import { OpenRouterProvider } from "./providers/openrouter.provider";
import { OllamaProvider } from "./providers/ollama.provider";
import { NvidiaProvider } from "./providers/nvidia.provider";
import { env } from "@/common/utils/envConfig";

export type AIProviderType = "openrouter" | "ollama" | "nvidia";

const providerCache = new Map<AIProviderType, IAIProvider>();

/**
 * Create or retrieve a cached AI provider instance
 */
export function createAIProvider(
	type?: AIProviderType,
): IAIProvider {
	const providerType = type || (env.AI_DEFAULT_PROVIDER as AIProviderType);

	if (providerCache.has(providerType)) {
		return providerCache.get(providerType)!;
	}

	let provider: IAIProvider;

	switch (providerType) {
		case "openrouter":
			provider = new OpenRouterProvider();
			break;
		case "ollama":
			provider = new OllamaProvider();
			break;
		case "nvidia":
			provider = new NvidiaProvider();
			break;
		default:
			throw new Error(`Unknown AI provider type: ${providerType}`);
	}

	providerCache.set(providerType, provider);
	return provider;
}

/**
 * Get list of available providers
 */
export function getAvailableProviders(): {
	name: AIProviderType;
	configured: boolean;
}[] {
	return [
		{
			name: "openrouter",
			configured: !!env.OPENROUTER_API_KEY,
		},
		{
			name: "ollama",
			configured: !!env.OLLAMA_BASE_URL,
		},
		{
			name: "nvidia",
			configured: !!env.NVIDIA_API_KEY,
		},
	];
}
