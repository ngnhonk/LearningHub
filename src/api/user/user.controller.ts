import type { Request, RequestHandler, Response } from "express";
import { AuthenticatedRequest } from "@/common/middleware/authenticate";
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

  public changePassword: RequestHandler = async (
    req: AuthenticatedRequest,
    res: Response,
  ) => {
    const { oldPassword, newPassword } = req.body;
    const serviceResponse = await userService.changePassword(
      req,
      oldPassword,
      newPassword,
      res,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const userController = new UserController();
