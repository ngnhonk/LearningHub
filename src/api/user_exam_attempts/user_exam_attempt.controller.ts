import type { Request, RequestHandler, Response } from "express";
import { userExamAttemptService } from "./user_exam_attempt.service";
import { AuthenticatedRequest } from "@/common/middleware/authenticate";

class UserExamAttemptController {
	public getAttempts: RequestHandler = async (_req: Request, res: Response) => {
		const serviceResponse = await userExamAttemptService.getAll();
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getAttempt: RequestHandler = async (req: AuthenticatedRequest, res: Response) => {
		const id = req.params.id as string;
		const userId = req.user?.id;
		const userRole = req.user?.role;
		const serviceResponse = await userExamAttemptService.getById(id, userId, userRole);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getByUserId: RequestHandler = async (req: AuthenticatedRequest, res: Response) => {
		const targetUserId = req.params.userId as string;
		const requestingUserId = req.user?.id;
		const userRole = req.user?.role;
		const serviceResponse = await userExamAttemptService.getByUserId(targetUserId, requestingUserId, userRole);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getActiveAttempt: RequestHandler = async (req: AuthenticatedRequest, res: Response) => {
		const userId = req.user?.id as string;
		const examId = req.params.examId as string;
		const serviceResponse = await userExamAttemptService.getActiveAttempt(userId, examId);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getByExamId: RequestHandler = async (req: Request, res: Response) => {
		const examId = req.params.examId as string;
		const serviceResponse = await userExamAttemptService.getByExamId(examId);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public startAttempt: RequestHandler = async (req: AuthenticatedRequest, res: Response) => {
		const userId = req.user?.id as string;
		const { exam_id } = req.body;
		const serviceResponse = await userExamAttemptService.startAttempt(userId, exam_id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public batchSaveAnswers: RequestHandler = async (req: AuthenticatedRequest, res: Response) => {
		const id = req.params.id as string;
		const userId = req.user?.id as string;
		const userRole = req.user?.role;
		const { answers } = req.body;
		const serviceResponse = await (userExamAttemptService as any).userAnswerService?.saveBatchUserAnswers(userId, id, answers, userRole)
			|| await require("@/api/user_answers/user_answer.service").userAnswerService.saveBatchUserAnswers(userId, id, answers, userRole);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public submitAttempt: RequestHandler = async (req: AuthenticatedRequest, res: Response) => {
		const id = req.params.id as string;
		const userId = req.user?.id as string;
		const userRole = req.user?.role;
		const score = req.body?.score;
		const time_spent_seconds = req.body?.time_spent_seconds;
		const answers = req.body?.answers;
		const serviceResponse = await userExamAttemptService.submitAttempt(id, userId, score, time_spent_seconds, answers, userRole);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public deleteAttempt: RequestHandler = async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const serviceResponse = await userExamAttemptService.deleteById(id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getAttemptResult: RequestHandler = async (req: AuthenticatedRequest, res: Response) => {
		const id = req.params.id as string;
		const userId = req.user?.id;
		const userRole = req.user?.role;
		const serviceResponse = await userExamAttemptService.getAttemptResult(id, userId, userRole);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};
}

export const userExamAttemptController = new UserExamAttemptController();

