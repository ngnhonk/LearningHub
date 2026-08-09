import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { authenticate, authorize, TEACHER_OR_ABOVE } from "@/common/middleware/authenticate";
import { aiGenerationController } from "./ai-generation.controller";
import {
	GenerateExamRequestSchema,
	GenerateExamResponseSchema,
	UploadDocumentResponseSchema,
	SyncQuestionsResponseSchema,
	SyncQuestionsRequestSchema,
} from "./ai-generation.model";
import multer from "multer";

// Multer setup for markdown file upload (memory storage)
const markdownStorage = multer.memoryStorage();
const markdownFilter = (
	_req: any,
	file: Express.Multer.File,
	cb: multer.FileFilterCallback,
) => {
	const extMatch = Boolean(file.originalname && file.originalname.match(/\.(md|markdown|txt)$/i));
	const mimeMatch =
		!file.mimetype ||
		file.mimetype === "text/markdown" ||
		file.mimetype === "text/plain" ||
		file.mimetype === "text/x-markdown" ||
		file.mimetype === "application/octet-stream" ||
		file.mimetype === "application/x-markdown";

	if (extMatch || mimeMatch) {
		cb(null, true);
	} else {
		cb(
			new Error(
				"Only Markdown files are allowed (.md, .markdown, .txt)",
			) as any,
			false,
		);
	}
};

const uploadMarkdown = multer({
	storage: markdownStorage,
	fileFilter: markdownFilter,
	limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const aiGenerationRegistry = new OpenAPIRegistry();
export const aiGenerationRouter: Router = express.Router();

// ===== POST /ai/generate-exam =====
aiGenerationRegistry.registerPath({
	method: "post",
	path: "/ai/generate-exam",
	tags: ["AI Generation"],
	summary: "Generate exam questions using AI with optional RAG context",
	request: {
		body: {
			content: {
				"application/json": {
					schema: GenerateExamRequestSchema.shape.body,
				},
			},
		},
	},
	responses: createApiResponse(GenerateExamResponseSchema, "Success"),
});

aiGenerationRouter.post(
	"/generate-exam",
	authenticate,
	authorize(TEACHER_OR_ABOVE),
	validateRequest(GenerateExamRequestSchema),
	aiGenerationController.generateExam,
);

// ===== POST /ai/upload-document =====
aiGenerationRegistry.registerPath({
	method: "post",
	path: "/ai/upload-document",
	tags: ["AI Generation"],
	summary: "Upload a markdown document to the RAG knowledge base",
	request: {
		body: {
			content: {
				"multipart/form-data": {
					schema: {
						type: "object",
						properties: {
							subject_id: {
								type: "string",
								description: "ID of the subject this document belongs to",
							},
							file: {
								type: "string",
								format: "binary",
								description: "Markdown file (.md, .txt)",
							},
						},
						required: ["subject_id", "file"],
					},
				},
			},
		},
	},
	responses: createApiResponse(UploadDocumentResponseSchema, "Success"),
});

aiGenerationRouter.post(
	"/upload-document",
	authenticate,
	authorize(TEACHER_OR_ABOVE),
	uploadMarkdown.single("file"),
	aiGenerationController.uploadDocument,
);

// ===== POST /ai/sync-questions =====
aiGenerationRegistry.registerPath({
	method: "post",
	path: "/ai/sync-questions",
	tags: ["AI Generation"],
	summary: "Sync existing questions from MySQL database to vector store (Qdrant)",
	request: {
		body: {
			content: {
				"application/json": {
					schema: SyncQuestionsRequestSchema.shape.body,
				},
			},
		},
	},
	responses: createApiResponse(SyncQuestionsResponseSchema, "Success"),
});

aiGenerationRouter.post(
	"/sync-questions",
	authenticate,
	authorize(TEACHER_OR_ABOVE),
	aiGenerationController.syncQuestions,
);

// ===== GET /ai/providers =====
aiGenerationRegistry.registerPath({
	method: "get",
	path: "/ai/providers",
	tags: ["AI Generation"],
	summary: "List available AI providers and their configuration status",
	responses: createApiResponse(z.array(z.object({
		name: z.string(),
		configured: z.boolean(),
	})), "Success"),
});

aiGenerationRouter.get(
	"/providers",
	authenticate,
	aiGenerationController.getProviders,
);

// ===== GET /ai/vector-status =====
aiGenerationRegistry.registerPath({
	method: "get",
	path: "/ai/vector-status",
	tags: ["AI Generation"],
	summary: "Get vector store (Qdrant) collection status",
	responses: createApiResponse(z.object({
		vectors_count: z.number(),
		status: z.string(),
	}), "Success"),
});

aiGenerationRouter.get(
	"/vector-status",
	authenticate,
	aiGenerationController.getVectorStatus,
);
