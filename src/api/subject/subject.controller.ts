import type { Request, RequestHandler, Response } from "express";

import { subjectService } from "@/api/subject/subject.service";

class SubjectController {
	public getSubjects: RequestHandler = async (_req: Request, res: Response) => {
		const serviceResponse = await subjectService.getAll();
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getSubject: RequestHandler = async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const serviceResponse = await subjectService.getById(id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public createSubject: RequestHandler = async (req: Request, res: Response) => {
		const { name, description } = req.body;
		const serviceResponse = await subjectService.createSubject(name, description);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public updateSubject: RequestHandler = async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const payload = req.body;
		const serviceResponse = await subjectService.updateSubject(id, payload);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public deleteSubject: RequestHandler = async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const serviceResponse = await subjectService.deleteById(id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};
}

export const subjectController = new SubjectController();
