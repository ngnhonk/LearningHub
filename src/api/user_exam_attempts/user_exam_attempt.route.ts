import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { userExamAttemptController } from "./user_exam_attempt.controller";
import {
  GetUserExamAttemptSchema,
  GetByUserIdSchema,
  GetByExamIdSchema,
  StartAttemptSchema,
  SubmitAttemptSchema,
  DeleteUserExamAttemptSchema,
  UserExamAttemptSchema,
} from "./user_exam_attempt.model";
import { authenticate, authorize } from "@/common/middleware/authenticate";

export const userExamAttemptRegistry = new OpenAPIRegistry();
export const userExamAttemptRouter: Router = express.Router();

userExamAttemptRegistry.register("UserExamAttempt", UserExamAttemptSchema);

// get all (admin only)
userExamAttemptRegistry.registerPath({
  method: "get",
  path: "/user-exam-attempts",
  summary: "Get all user exam attempts (admin only)",
  tags: ["UserExamAttempt"],
  responses: createApiResponse(z.array(UserExamAttemptSchema), "Success"),
});

userExamAttemptRouter.get(
  "/",
  authenticate,
  authorize(["admin"]),
  userExamAttemptController.getAttempts,
);

// get by user id
userExamAttemptRegistry.registerPath({
  method: "get",
  path: "/user-exam-attempts/user/{userId}",
  summary: "Get all attempts by a specific user",
  tags: ["UserExamAttempt"],
  request: { params: GetByUserIdSchema.shape.params },
  responses: createApiResponse(z.array(UserExamAttemptSchema), "Success"),
});

userExamAttemptRouter.get(
  "/user/:userId",
  authenticate,
  validateRequest(GetByUserIdSchema),
  userExamAttemptController.getByUserId,
);

// get by exam id
userExamAttemptRegistry.registerPath({
  method: "get",
  path: "/user-exam-attempts/exam/{examId}",
  summary: "Get all attempts for a specific exam",
  tags: ["UserExamAttempt"],
  request: { params: GetByExamIdSchema.shape.params },
  responses: createApiResponse(z.array(UserExamAttemptSchema), "Success"),
});

userExamAttemptRouter.get(
  "/exam/:examId",
  authenticate,
  validateRequest(GetByExamIdSchema),
  userExamAttemptController.getByExamId,
);

// start attempt
userExamAttemptRegistry.registerPath({
  method: "post",
  path: "/user-exam-attempts/start",
  summary: "Start a new exam attempt",
  tags: ["UserExamAttempt"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: StartAttemptSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(UserExamAttemptSchema, "Success"),
});

userExamAttemptRouter.post(
  "/start",
  validateRequest(StartAttemptSchema),
  authenticate,
  userExamAttemptController.startAttempt,
);

// submit attempt
userExamAttemptRegistry.registerPath({
  method: "put",
  path: "/user-exam-attempts/{id}/submit",
  summary: "Submit an exam attempt",
  tags: ["UserExamAttempt"],
  request: {
    params: SubmitAttemptSchema.shape.params,
    body: {
      content: {
        "application/json": {
          schema: SubmitAttemptSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(UserExamAttemptSchema, "Success"),
});

userExamAttemptRouter.put(
  "/:id/submit",
  validateRequest(SubmitAttemptSchema),
  authenticate,
  userExamAttemptController.submitAttempt,
);

// get one by id
userExamAttemptRegistry.registerPath({
  method: "get",
  path: "/user-exam-attempts/{id}",
  summary: "Get a user exam attempt by id",
  tags: ["UserExamAttempt"],
  request: { params: GetUserExamAttemptSchema.shape.params },
  responses: createApiResponse(UserExamAttemptSchema, "Success"),
});

userExamAttemptRouter.get(
  "/:id",
  authenticate,
  validateRequest(GetUserExamAttemptSchema),
  userExamAttemptController.getAttempt,
);

// delete attempt (admin only)
userExamAttemptRegistry.registerPath({
  method: "delete",
  path: "/user-exam-attempts/{id}",
  summary: "Delete a user exam attempt (admin only)",
  tags: ["UserExamAttempt"],
  request: { params: DeleteUserExamAttemptSchema.shape.params },
  responses: createApiResponse(z.number(), "Success"),
});

userExamAttemptRouter.delete(
  "/:id",
  authenticate,
  authorize(["admin"]),
  validateRequest(DeleteUserExamAttemptSchema),
  userExamAttemptController.deleteAttempt,
);
