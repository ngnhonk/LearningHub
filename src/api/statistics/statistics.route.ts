import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { statisticsController } from "./statistics.controller";
import {
  GetExamStatisticsSchema,
  StudentStatisticsSchema,
  ExamStatisticsSchema,
  AdminOverviewSchema,
} from "./statistics.model";
import { authenticate, authorize } from "@/common/middleware/authenticate";

export const statisticsRegistry = new OpenAPIRegistry();
export const statisticsRouter: Router = express.Router();

// student personal statistics
statisticsRegistry.registerPath({
  method: "get",
  path: "/statistics/student/me",
  summary: "Get personal statistics for the authenticated student",
  tags: ["Statistics"],
  responses: createApiResponse(StudentStatisticsSchema, "Success"),
});

statisticsRouter.get(
  "/student/me",
  authenticate,
  statisticsController.getStudentStatistics,
);

// exam statistics
statisticsRegistry.registerPath({
  method: "get",
  path: "/statistics/exam/{examId}",
  summary: "Get statistics for a specific exam",
  tags: ["Statistics"],
  request: { params: GetExamStatisticsSchema.shape.params },
  responses: createApiResponse(ExamStatisticsSchema, "Success"),
});

statisticsRouter.get(
  "/exam/:examId",
  authenticate,
  validateRequest(GetExamStatisticsSchema),
  statisticsController.getExamStatistics,
);

// admin overview
statisticsRegistry.registerPath({
  method: "get",
  path: "/statistics/admin/overview",
  summary: "Get system overview statistics (admin only)",
  tags: ["Statistics"],
  responses: createApiResponse(AdminOverviewSchema, "Success"),
});

statisticsRouter.get(
  "/admin/overview",
  authenticate,
  authorize(["admin", "teacher"]),
  statisticsController.getAdminOverview,
);
