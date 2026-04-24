import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { authController } from "./auth.controller";
import {
    LoginResponseSchema,
    LoginSchema,
    RegisterResponseSchema,
    RegisterSchema,
    GetAccessTokenResponseSchema,
} from "./auth.model";
import { authenticate } from "@/common/middleware/authenticate";

export const authRegistry = new OpenAPIRegistry();
export const authRouter: Router = express.Router();

// Login
authRegistry.registerPath({
    method: "post",
    path: "/auth/login",
    tags: ["Auth"],
    request: {
        body: {
            content: {
                "application/json": {
                    schema: LoginSchema.shape.body,
                },
            },
        },
    },
    responses: createApiResponse(LoginResponseSchema, "Success"),
});
authRouter.post("/login", validateRequest(LoginSchema), authController.login);

authRegistry.registerPath({
    method: "post",
    path: "/auth/register",
    tags: ["Auth"],
    request: {
        body: {
            content: {
                "application/json": {
                    schema: RegisterSchema.shape.body,
                },
            },
        },
    },
    responses: createApiResponse(RegisterResponseSchema, "Success"),
});

authRouter.post(
    "/register",
    validateRequest(RegisterSchema),
    authController.register,
);

// Get New Access Token
authRegistry.registerPath({
    method: "post",
    path: "/auth/token",
    tags: ["Auth"],
    responses: createApiResponse(GetAccessTokenResponseSchema, "Success"),
});

authRouter.post(
    "/token",
    authController.getAccessToken,
);

// Log out
authRegistry.registerPath({
    method: "post",
    path: "/auth/logout",
    tags: ["Auth"],
    responses: createApiResponse(RegisterResponseSchema, "Success"),
});

authRouter.post("/logout", authenticate, authController.logout);
