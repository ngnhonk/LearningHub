import type { Request, RequestHandler, Response } from "express";
import { userAnswerService } from "./user_answer.service";

class UserAnswerController {
	public getUserAnswers: RequestHandler = async (_req: Request, res: Response) => {
		const serviceResponse = await userAnswerService.getAll();
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getUserAnswer: RequestHandler = async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const serviceResponse = await userAnswerService.getById(id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getByAttemptId: RequestHandler = async (req: Request, res: Response) => {
		const attempId = req.params.attempId as string;
		const serviceResponse = await userAnswerService.getByAttemptId(attempId);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public createUserAnswer: RequestHandler = async (req: Request, res: Response) => {
		const { attemp_id, question_id, selected_answer_id } = req.body;
		const serviceResponse = await userAnswerService.createUserAnswer(attemp_id, question_id, selected_answer_id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public updateUserAnswer: RequestHandler = async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const { selected_answer_id } = req.body;
		const serviceResponse = await userAnswerService.updateUserAnswer(id, selected_answer_id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public deleteUserAnswer: RequestHandler = async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const serviceResponse = await userAnswerService.deleteById(id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};
}

export const userAnswerController = new UserAnswerController();
