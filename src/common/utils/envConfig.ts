import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]).default("production"),

	HOST: z.string().min(1).default("localhost"),

	PORT: z.coerce.number().int().positive().default(8080),

	CORS_ORIGIN: z.string().url().default("http://localhost:8080"),

	COMMON_RATE_LIMIT_MAX_REQUESTS: z.coerce
		.number()
		.int()
		.positive()
		.default(1000),

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
