import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export const GetExamStatisticsSchema = z.object({
	params: z.object({ examId: commonValidations.id }),
});

export const StudentStatisticsSchema = z.object({
	total_attempts: z.number(),
	average_score: z.number(),
	correct_rate: z.number(),
	exams_taken: z.number(),
});

export const ExamStatisticsSchema = z.object({
	total_attempts: z.number(),
	average_score: z.number(),
	pass_rate: z.number(),
	highest_score: z.number(),
});

export const AdminOverviewSchema = z.object({
	total_users: z.number(),
	total_subjects: z.number(),
	total_exams: z.number(),
	total_questions: z.number(),
	total_attempts: z.number(),
});
