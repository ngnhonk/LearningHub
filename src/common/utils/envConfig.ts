import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]).default("production"),

	HOST: z.string().min(1).default("localhost"),

	PORT: z.coerce.number().int().positive().default(8080),

	CORS_ORIGIN: z
		.string()
		.default("http://localhost:8080")
		.transform((val) => {
			if (!val.trim()) return "http://localhost:8080";
			if (val.trim() === "*") return "*";
			const origins = val
				.split(",")
				.map((s) => s.trim().replace(/\/+$/, ""))
				.filter(Boolean);
			if (origins.length === 0) return "http://localhost:8080";
			return origins.length === 1 ? origins[0] : origins;
		}),

	COMMON_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(1000),

	COMMON_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(1000),

	DB_HOST: z.string().min(1),
	DB_PORT: z.coerce.number().int().positive(),
	DB_USER: z.string().min(1),
	DB_PASSWORD: z.string().min(1),
	DB_NAME: z.string().min(1),

	EMAIL_USER: z.string().email(),
	EMAIL_PASS: z.string().min(1),

	JWT_SECRET: z.string(),
	JWT_TEMP_SECRET: z.string(),
	JWT_ACCESS_TOKEN_SECRET: z.string(),
	JWT_REFRESH_TOKEN_SECRET: z.string(),
	JWT_ACCESS_TOKEN_TIME: z.string(),
	JWT_REFRESH_TOKEN_TIME: z.string(),
	TOKEN_HASH_SECRET: z.string(),
	SALT_ROUNDS: z.string(),

	// AI Provider
	AI_DEFAULT_PROVIDER: z.enum(["openrouter", "ollama", "nvidia"]).default("openrouter"),
	AI_DEFAULT_MODEL: z.string().default("google/gemini-2.5-flash"),

	// OpenRouter
	OPENROUTER_API_KEY: z.string().default(""),

	// Ollama (local)
	OLLAMA_BASE_URL: z.string().default("http://localhost:11434"),
	OLLAMA_MODEL: z.string().default("llama3.1"),
	OLLAMA_EMBED_MODEL: z.string().default("nomic-embed-text"),

	// NVIDIA NIM
	NVIDIA_API_KEY: z.string().default(""),
	NVIDIA_MODEL: z.string().default("meta/llama-3.1-70b-instruct"),

	// Qdrant
	QDRANT_HOST: z.string().default("localhost"),
	QDRANT_PORT: z.coerce.number().int().positive().default(6333),
	QDRANT_API_KEY: z.string().default(""),
	QDRANT_COLLECTION: z.string().default("learning_documents"),

	// Embedding
	EMBEDDING_MODEL: z.string().default("openai/text-embedding-3-small"),
	EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(1536),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
	console.error("❌ Invalid environment variables:", parsedEnv.error.format());
	throw new Error("Invalid environment variables");
}

export const env = {
	...parsedEnv.data,
	isDevelopment: parsedEnv.data.NODE_ENV === "development",
	isProduction: parsedEnv.data.NODE_ENV === "production",
	isTest: parsedEnv.data.NODE_ENV === "test",
};
