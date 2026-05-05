import type { Request, RequestHandler, Response } from "express";

import { userService } from "@/api/user/user.service";

class UserController {
	public getUsers: RequestHandler = async (_req: Request, res: Response) => {
		const serviceResponse = await userService.getAll();
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getUser: RequestHandler = async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const serviceResponse = await userService.getById(id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};
}

export const userController = new UserController();
