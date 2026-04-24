import type { Request, RequestHandler, Response } from "express";
import { questionService } from "./question.service";

class QuestionController {
  public getQuestions: RequestHandler = async (
    _req: Request,
    res: Response,
  ) => {
    const serviceResponse = await questionService.getAll();
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public getQuestion: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await questionService.getById(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public createQuestion: RequestHandler = async (
    req: Request,
    res: Response,
  ) => {
    const { content, created_by } = req.body; // later: lấy id của người tạo từ cookie, api này bắt buộc phải đăng nhập
    const serviceResponse = await questionService.createQuestion(
      content,
      created_by,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public updateQuestion: RequestHandler = async (
    req: Request,
    res: Response,
  ) => {
    const id = req.params.id as string;
    const payload = req.body;
    const serviceResponse = await questionService.updateQuestion(id, payload);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public deleteQuestion: RequestHandler = async (
    req: Request,
    res: Response,
  ) => {
    const id = req.params.id as string;
    const serviceResponse = await questionService.deleteById(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const questionController = new QuestionController();
