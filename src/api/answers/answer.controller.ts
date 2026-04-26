import type { Request, RequestHandler, Response } from "express";

import { answerService } from "@/api/answers/answer.service";

class AnswerController {
	public getAnswers: RequestHandler = async (_req: Request, res: Response) => {
		const serviceResponse = await answerService.getAll();
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getAnswer: RequestHandler = async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const serviceResponse = await answerService.getById(id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public createAnswer: RequestHandler = async (req: Request, res: Response) => {
		const { question_id, content, is_correct } = req.body;
		const serviceResponse = await answerService.createAnswer(question_id, content, is_correct);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public updateAnswer: RequestHandler = async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const payload = req.body;
		const serviceResponse = await answerService.updateAnswer(id, payload);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public deleteAnswer: RequestHandler = async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const serviceResponse = await answerService.deleteById(id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};
}

export const answerController = new AnswerController();
