import type { Request, RequestHandler, Response } from "express";
import { aiGenerationService } from "./ai-generation.service";
import { getAvailableProviders } from "@/common/ai/ai-provider.factory";
import { vectorStoreService } from "@/common/ai/vector-store.service";
import type { AuthenticatedRequest } from "@/common/middleware/authenticate";

class AIGenerationController {
	/**
	 * POST /ai/generate-exam
	 * Generate exam questions using AI + RAG
	 */
	public generateExam: RequestHandler = async (
		req: AuthenticatedRequest,
		res: Response,
	) => {
		const {
			subject_id,
			topic,
			num_questions,
			difficulty,
			language,
			exam_title,
			exam_duration_minutes,
			additional_instructions,
			provider,
			auto_save,
		} = req.body;

		const created_by = (req as any).user.id;

		const serviceResponse = await aiGenerationService.generateExam({
			subject_id,
			topic,
			num_questions: num_questions || 10,
			difficulty: difficulty || "medium",
			language: language || "vi",
			exam_title,
			exam_duration_minutes,
			additional_instructions,
			provider,
			auto_save: auto_save !== false,
			created_by,
		});

		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	/**
	 * POST /ai/upload-document
	 * Upload a markdown document for RAG knowledge base
	 */
	public uploadDocument: RequestHandler = async (
		req: AuthenticatedRequest,
		res: Response,
	) => {
		if (!req.file) {
			res.status(400).send({
				success: false,
				message: "No file uploaded",
				responseObject: null,
				statusCode: 400,
			});
			return;
		}

		const subjectId = req.body.subject_id;
		const fileContent = req.file.buffer.toString("utf-8");
		const filename = req.file.originalname;

		const serviceResponse = await aiGenerationService.uploadDocument(
			fileContent,
			subjectId,
			filename,
		);

		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	/**
	 * POST /ai/sync-questions
	 * Sync existing questions from MySQL to Qdrant vector store
	 */
	public syncQuestions: RequestHandler = async (
		req: Request,
		res: Response,
	) => {
		const { subject_id } = req.body;

		const serviceResponse = await aiGenerationService.syncQuestions(
			subject_id,
		);

		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	/**
	 * GET /ai/providers
	 * List available AI providers and their configuration status
	 */
	public getProviders: RequestHandler = async (
		_req: Request,
		res: Response,
	) => {
		const providers = getAvailableProviders();
		res.status(200).send({
			success: true,
			message: "Available AI providers",
			responseObject: providers,
			statusCode: 200,
		});
	};

	/**
	 * GET /ai/vector-status
	 * Get vector store collection status
	 */
	public getVectorStatus: RequestHandler = async (
		_req: Request,
		res: Response,
	) => {
		try {
			const info = await vectorStoreService.getCollectionInfo();
			res.status(200).send({
				success: true,
				message: "Vector store status",
				responseObject: info,
				statusCode: 200,
			});
		} catch {
			res.status(200).send({
				success: true,
				message: "Vector store not initialized",
				responseObject: { vectors_count: 0, status: "not_connected" },
				statusCode: 200,
			});
		}
	};
}

export const aiGenerationController = new AIGenerationController();
