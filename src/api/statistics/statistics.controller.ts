import type { Request, RequestHandler, Response } from "express";
import { statisticsService } from "./statistics.service";
import { AuthenticatedRequest } from "@/common/middleware/authenticate";

class StatisticsController {
	public getStudentStatistics: RequestHandler = async (req: AuthenticatedRequest, res: Response) => {
		const userId = (req as any).user.id;
		const serviceResponse = await statisticsService.getStudentStatistics(userId);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getExamStatistics: RequestHandler = async (req: Request, res: Response) => {
		const examId = req.params.examId as string;
		const serviceResponse = await statisticsService.getExamStatistics(examId);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getAdminOverview: RequestHandler = async (_req: Request, res: Response) => {
		const serviceResponse = await statisticsService.getAdminOverview();
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};
}

export const statisticsController = new StatisticsController();
