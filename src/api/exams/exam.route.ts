import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { examController } from "./exam.controller";
import {
  CreateExamSchema,
  DeleteExamSchema,
  GetExamSchema,
  ExamSchema,
  UpdateExamSchema,
} from "./exam.model";
import { authenticate, authorize } from "@/common/middleware/authenticate";

export const examRegistry = new OpenAPIRegistry();
export const examRouter: Router = express.Router();

examRegistry.register("Exam", ExamSchema);

// get all
examRegistry.registerPath({
  method: "get",
  path: "/exams",
  summary: "Get all exams",
  tags: ["Exam"],
  responses: createApiResponse(z.array(ExamSchema), "Success"),
});

examRouter.get("/", examController.getExams);

// get one by id
examRegistry.registerPath({
  method: "get",
  path: "/exams/{id}",
  summary: "Get an exam by id",
  tags: ["Exam"],
  request: { params: GetExamSchema.shape.params },
  responses: createApiResponse(ExamSchema, "Success"),
});

examRouter.get(
  "/:id",
  validateRequest(GetExamSchema),
  examController.getExam,
);

// create one
examRegistry.registerPath({
  method: "post",
  path: "/exams",
  tags: ["Exam"],
  summary: "Create an exam",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateExamSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(ExamSchema, "Success"),
});

examRouter.post(
  "/",
  validateRequest(CreateExamSchema),
  authenticate,
  authorize(["admin"]),
  examController.createExam,
);

// update an exam
examRegistry.registerPath({
  method: "put",
  path: "/exams/{id}",
  tags: ["Exam"],
  summary: "Update an exam",
  request: {
    params: UpdateExamSchema.shape.params,
    body: {
      content: {
        "application/json": {
          schema: UpdateExamSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(ExamSchema, "Success"),
});

examRouter.put(
  "/:id",
  validateRequest(UpdateExamSchema),
  examController.updateExam,
);

// delete an exam by id
examRegistry.registerPath({
  method: "delete",
  path: "/exams/{id}",
  summary: "Delete an exam by id",
  tags: ["Exam"],
  request: { params: DeleteExamSchema.shape.params },
  responses: createApiResponse(z.number(), "Success"),
});

examRouter.delete(
  "/:id",
  validateRequest(DeleteExamSchema),
  examController.deleteExam,
);
