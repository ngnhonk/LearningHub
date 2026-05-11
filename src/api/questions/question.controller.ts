import type { Request, RequestHandler, Response } from "express";
import { questionService } from "./question.service";

import { AuthenticatedRequest } from "@/common/middleware/authenticate";
class QuestionController {
	public getQuestions: RequestHandler = async (_req: Request, res: Response) => {
		const serviceResponse = await questionService.getAll();
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getQuestion: RequestHandler = async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const serviceResponse = await questionService.getById(id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public createQuestion: RequestHandler = async (req: AuthenticatedRequest, res: Response) => {
		const { content } = req.body;
		const created_by = (req as any).user.id;
		const serviceResponse = await questionService.createQuestion(content, created_by);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public updateQuestion: RequestHandler = async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const payload = req.body;
		const serviceResponse = await questionService.updateQuestion(id, payload);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public deleteQuestion: RequestHandler = async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const serviceResponse = await questionService.deleteById(id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};
}

export const questionController = new QuestionController();
