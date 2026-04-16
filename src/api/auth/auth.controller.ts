import type { Request, RequestHandler, Response } from "express";

import { authService } from "./auth.service";

class AuthController {
    public login: RequestHandler = async (req: Request, res: Response) => {
        const { identify, password } = req.body;
        const serviceResponse = await authService.login(identify, password, res);
        res.status(serviceResponse.statusCode).send(serviceResponse);
    };

    public register: RequestHandler = async (req: Request, res: Response) => {
        const { email, username, password } = req.body;
        const serviceResponse = await authService.register(
            email,
            username,
            password,
        );
        res.status(serviceResponse.statusCode).send(serviceResponse);
    };

    public logout: RequestHandler = async (req: Request, res: Response) => {
        const { refreshToken } = req.cookies;
        const serviceResponse = await authService.logout(refreshToken, res);
        res.status(serviceResponse.statusCode).send(serviceResponse);
    };

    public getAccessToken: RequestHandler = async (
        req: Request,
        res: Response,
    ) => {
        const refreshToken = req.cookies.refreshToken;
        const serviceResponse = await authService.createAccessToken(refreshToken, res);
        res.status(serviceResponse.statusCode).send(serviceResponse);
    };
}

export const authController = new AuthController();
