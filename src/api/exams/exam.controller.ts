import type { Request, RequestHandler, Response } from "express";
import { examService } from "./exam.service";

import { AuthenticatedRequest } from "@/common/middleware/authenticate";

class ExamController {
	public getExams: RequestHandler = async (_req: Request, res: Response) => {
		const serviceResponse = await examService.getAll();
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getExam: RequestHandler = async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const serviceResponse = await examService.getById(id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public createExam: RequestHandler = async (req: AuthenticatedRequest, res: Response) => {
		const { title, description, subject_id, duration_minutes, total_marks, pass_percentage, is_published } = req.body;
		const created_by = (req as any).user.id;
		const serviceResponse = await examService.createExam(
			title,
			description,
			subject_id,
			duration_minutes,
			total_marks,
			pass_percentage,
			is_published,
			created_by,
		);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public updateExam: RequestHandler = async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const payload = req.body;
		const serviceResponse = await examService.updateExam(id, payload);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public deleteExam: RequestHandler = async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const serviceResponse = await examService.deleteById(id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getBySubjectId: RequestHandler = async (req: Request, res: Response) => {
		const subjectId = req.params.subjectId as string;
		const serviceResponse = await examService.getBySubjectId(subjectId);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getExamDetail: RequestHandler = async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const serviceResponse = await examService.getExamDetail(id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public importExam: RequestHandler = async (req: AuthenticatedRequest, res: Response) => {
		const subjectId = req.body.subject_id as string;
		const createdBy = (req as any).user.id;
		const file = req.file;

		if (!subjectId) {
			res.status(400).send({
				success: false,
				message: "subject_id is required",
				statusCode: 400,
			});
			return;
		}

		if (!file) {
			res.status(400).send({
				success: false,
				message: "Excel file is required",
				statusCode: 400,
			});
			return;
		}

		const serviceResponse = await examService.importExam(subjectId, createdBy, file.buffer);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};
}

export const examController = new ExamController();
