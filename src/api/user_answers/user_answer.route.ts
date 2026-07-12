import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { userAnswerController } from "./user_answer.controller";
import {
  GetUserAnswerSchema,
  GetByAttemptIdSchema,
  CreateUserAnswerSchema,
  UpdateUserAnswerSchema,
  DeleteUserAnswerSchema,
  UserAnswerSchema,
} from "./user_answer.model";
import { authenticate, authorize } from "@/common/middleware/authenticate";

export const userAnswerRegistry = new OpenAPIRegistry();
export const userAnswerRouter: Router = express.Router();

userAnswerRegistry.register("UserAnswer", UserAnswerSchema);

// get all (admin only)
userAnswerRegistry.registerPath({
  method: "get",
  path: "/user-answers",
  summary: "Get all user answers (admin only)",
  tags: ["UserAnswer"],
  responses: createApiResponse(z.array(UserAnswerSchema), "Success"),
});

userAnswerRouter.get(
  "/",
  authenticate,
  authorize(["admin"]),
  userAnswerController.getUserAnswers,
);

// get by attempt id
userAnswerRegistry.registerPath({
  method: "get",
  path: "/user-answers/attempt/{attempId}",
  summary: "Get all answers for a specific attempt",
  tags: ["UserAnswer"],
  request: { params: GetByAttemptIdSchema.shape.params },
  responses: createApiResponse(z.array(UserAnswerSchema), "Success"),
});

userAnswerRouter.get(
  "/attempt/:attempId",
  authenticate,
  validateRequest(GetByAttemptIdSchema),
  userAnswerController.getByAttemptId,
);

// create (submit an answer)
userAnswerRegistry.registerPath({
  method: "post",
  path: "/user-answers",
  summary: "Submit an answer (auto-checks correctness)",
  tags: ["UserAnswer"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateUserAnswerSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(UserAnswerSchema, "Success"),
});

userAnswerRouter.post(
  "/",
  validateRequest(CreateUserAnswerSchema),
  authenticate,
  userAnswerController.createUserAnswer,
);

// update an answer (change selected answer, re-checks correctness)
userAnswerRegistry.registerPath({
  method: "put",
  path: "/user-answers/{id}",
  summary: "Update a user answer (re-checks correctness)",
  tags: ["UserAnswer"],
  request: {
    params: UpdateUserAnswerSchema.shape.params,
    body: {
      content: {
        "application/json": {
          schema: UpdateUserAnswerSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(UserAnswerSchema, "Success"),
});

userAnswerRouter.put(
  "/:id",
  validateRequest(UpdateUserAnswerSchema),
  authenticate,
  userAnswerController.updateUserAnswer,
);

// get one by id
userAnswerRegistry.registerPath({
  method: "get",
  path: "/user-answers/{id}",
  summary: "Get a user answer by id",
  tags: ["UserAnswer"],
  request: { params: GetUserAnswerSchema.shape.params },
  responses: createApiResponse(UserAnswerSchema, "Success"),
});

userAnswerRouter.get(
  "/:id",
  authenticate,
  validateRequest(GetUserAnswerSchema),
  userAnswerController.getUserAnswer,
);

// delete a user answer (admin only)
userAnswerRegistry.registerPath({
  method: "delete",
  path: "/user-answers/{id}",
  summary: "Delete a user answer (admin only)",
  tags: ["UserAnswer"],
  request: { params: DeleteUserAnswerSchema.shape.params },
  responses: createApiResponse(z.number(), "Success"),
});

userAnswerRouter.delete(
  "/:id",
  authenticate,
  authorize(["admin"]),
  validateRequest(DeleteUserAnswerSchema),
  userAnswerController.deleteUserAnswer,
);
