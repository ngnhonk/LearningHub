import type { Request, RequestHandler, Response } from "express";
import { userExamAttemptService } from "./user_exam_attempt.service";
import { AuthenticatedRequest } from "@/common/middleware/authenticate";

class UserExamAttemptController {
	public getAttempts: RequestHandler = async (_req: Request, res: Response) => {
		const serviceResponse = await userExamAttemptService.getAll();
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getAttempt: RequestHandler = async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const serviceResponse = await userExamAttemptService.getById(id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getByUserId: RequestHandler = async (req: Request, res: Response) => {
		const userId = req.params.userId as string;
		const serviceResponse = await userExamAttemptService.getByUserId(userId);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getByExamId: RequestHandler = async (req: Request, res: Response) => {
		const examId = req.params.examId as string;
		const serviceResponse = await userExamAttemptService.getByExamId(examId);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public startAttempt: RequestHandler = async (req: AuthenticatedRequest, res: Response) => {
		const userId = (req as any).user.id;
		const { exam_id } = req.body;
		const serviceResponse = await userExamAttemptService.startAttempt(userId, exam_id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public submitAttempt: RequestHandler = async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const { score, time_spent_seconds } = req.body;
		const serviceResponse = await userExamAttemptService.submitAttempt(id, score, time_spent_seconds);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public deleteAttempt: RequestHandler = async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const serviceResponse = await userExamAttemptService.deleteById(id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getAttemptResult: RequestHandler = async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const serviceResponse = await userExamAttemptService.getAttemptResult(id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};
}

export const userExamAttemptController = new UserExamAttemptController();
