import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

// ===== Request Schemas =====

export const GenerateExamRequestSchema = z.object({
	body: z.object({
		subject_id: commonValidations.id,
		topic: z.string().max(500).optional(),
		num_questions: z.coerce.number().int().min(1).max(50).default(10),
		difficulty: z
			.enum(["easy", "medium", "hard", "mixed"])
			.optional()
			.default("medium"),
		language: z.enum(["vi", "en"]).optional().default("vi"),
		exam_title: z.string().max(255).optional(),
		exam_duration_minutes: z.coerce.number().int().positive().optional().default(60),
		additional_instructions: z.string().max(1000).optional(),
		provider: z
			.enum(["openrouter", "ollama", "nvidia"])
			.optional(),
		auto_save: z.boolean().optional().default(true),
	}),
});

export const UploadDocumentRequestSchema = z.object({
	body: z.object({
		subject_id: commonValidations.id,
	}),
});

export const SyncQuestionsRequestSchema = z.object({
	body: z.object({
		subject_id: z.string().optional(),
	}),
});

// ===== Response Types =====

export interface GeneratedQuestionResponse {
	content: string;
	difficulty: string;
	explanation?: string;
	answers: {
		content: string;
		is_correct: boolean;
	}[];
}

export interface GenerateExamResponse {
	exam_id?: string;
	generated_questions: GeneratedQuestionResponse[];
	metadata: {
		provider_used: string;
		model_used: string;
		generation_time_ms: number;
		rag_context_used: boolean;
		total_questions: number;
	};
}

export interface UploadDocumentResponse {
	chunks_processed: number;
	subject_id: string;
}

export interface SyncQuestionsResponse {
	synced: number;
}

// ===== Zod Response Schemas (for OpenAPI) =====

export const GeneratedQuestionResponseSchema = z.object({
	content: z.string(),
	difficulty: z.string(),
	explanation: z.string().optional(),
	answers: z.array(
		z.object({
			content: z.string(),
			is_correct: z.boolean(),
		}),
	),
});

export const GenerateExamResponseSchema = z.object({
	exam_id: z.string().optional(),
	generated_questions: z.array(GeneratedQuestionResponseSchema),
	metadata: z.object({
		provider_used: z.string(),
		model_used: z.string(),
		generation_time_ms: z.number(),
		rag_context_used: z.boolean(),
		total_questions: z.number(),
	}),
});

export const UploadDocumentResponseSchema = z.object({
	chunks_processed: z.number(),
	subject_id: z.string(),
});

export const SyncQuestionsResponseSchema = z.object({
	synced: z.number(),
});
