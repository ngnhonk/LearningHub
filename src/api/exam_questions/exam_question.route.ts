import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { examQuestionController } from "./exam_question.controller";
import {
  CreateExamQuestionSchema,
  DeleteExamQuestionSchema,
  GetExamQuestionSchema,
  ExamQuestionSchema,
  UpdateExamQuestionSchema,
  GetQuestionsByExamIdSchema,
} from "./exam_question.model";

export const examQuestionRegistry = new OpenAPIRegistry();
export const examQuestionRouter: Router = express.Router();

examQuestionRegistry.register("ExamQuestion", ExamQuestionSchema);

// get all
examQuestionRegistry.registerPath({
  method: "get",
  path: "/exam-questions",
  summary: "Get all exam questions",
  tags: ["ExamQuestion"],
  responses: createApiResponse(z.array(ExamQuestionSchema), "Success"),
});

examQuestionRouter.get("/", examQuestionController.getExamQuestions);

// get one by id
examQuestionRegistry.registerPath({
  method: "get",
  path: "/exam-questions/{id}",
  summary: "Get an exam question by id",
  tags: ["ExamQuestion"],
  request: { params: GetExamQuestionSchema.shape.params },
  responses: createApiResponse(ExamQuestionSchema, "Success"),
});

examQuestionRouter.get(
  "/:id",
  validateRequest(GetExamQuestionSchema),
  examQuestionController.getExamQuestion,
);

// create one
examQuestionRegistry.registerPath({
  method: "post",
  path: "/exam-questions",
  tags: ["ExamQuestion"],
  summary: "Create an exam question",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateExamQuestionSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(ExamQuestionSchema, "Success"),
});

examQuestionRouter.post(
  "/",
  validateRequest(CreateExamQuestionSchema),
  examQuestionController.createExamQuestion,
);

// update an exam question
examQuestionRegistry.registerPath({
  method: "put",
  path: "/exam-questions/{id}",
  tags: ["ExamQuestion"],
  summary: "Update an exam question",
  request: {
    params: UpdateExamQuestionSchema.shape.params,
    body: {
      content: {
        "application/json": {
          schema: UpdateExamQuestionSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(ExamQuestionSchema, "Success"),
});

examQuestionRouter.put(
  "/:id",
  validateRequest(UpdateExamQuestionSchema),
  examQuestionController.updateExamQuestion,
);

// delete an exam question by id
examQuestionRegistry.registerPath({
  method: "delete",
  path: "/exam-questions/{id}",
  summary: "Delete an exam question by id",
  tags: ["ExamQuestion"],
  request: { params: DeleteExamQuestionSchema.shape.params },
  responses: createApiResponse(z.number(), "Success"),
});

examQuestionRouter.delete(
  "/:id",
  validateRequest(DeleteExamQuestionSchema),
  examQuestionController.deleteExamQuestion,
);

// get questions by exam_id
examQuestionRegistry.registerPath({
  method: "get",
  path: "/exam-questions/exam/{exam_id}",
  summary: "Get all questions by exam_id",
  tags: ["ExamQuestion"],
  request: { params: GetQuestionsByExamIdSchema.shape.params },
  responses: createApiResponse(ExamQuestionSchema, "Success"),
});

examQuestionRouter.get(
  "/exam/:exam_id",
  validateRequest(GetQuestionsByExamIdSchema),
  examQuestionController.getQuestionsByExamId,
);
