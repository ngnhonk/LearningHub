import type { Request, RequestHandler, Response } from "express";
import { examQuestionService } from "./exam_question.service";

class ExamQuestionController {
	public getExamQuestions: RequestHandler = async (_req: Request, res: Response) => {
		const serviceResponse = await examQuestionService.getAll();
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getExamQuestion: RequestHandler = async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const serviceResponse = await examQuestionService.getById(id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public createExamQuestion: RequestHandler = async (req: Request, res: Response) => {
		const { exam_id, question_id } = req.body;
		const serviceResponse = await examQuestionService.createExamQuestion(exam_id, question_id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public updateExamQuestion: RequestHandler = async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const payload = req.body;
		const serviceResponse = await examQuestionService.updateExamQuestion(id, payload);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public deleteExamQuestion: RequestHandler = async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const serviceResponse = await examQuestionService.deleteById(id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getQuestionsByExamId: RequestHandler = async (req: Request, res: Response) => {
		const exam_id = req.params.exam_id as string;
		const serviceResponse = await examQuestionService.getQuestionsByExamId(exam_id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};
}

export const examQuestionController = new ExamQuestionController();
