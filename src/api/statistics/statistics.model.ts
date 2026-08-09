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

export const GetLearningAnalyticsSchema = z.object({
	query: z.object({
		subjectId: z.string().optional(),
		timeframe: z.enum(["7days", "30days", "all"]).optional(),
	}).optional(),
});

export const SystemStatisticsSchema = z.object({
	users_breakdown: z.object({
		total: z.number(),
		students: z.number(),
		teachers: z.number(),
		admins: z.number(),
		new_7days: z.number(),
		new_30days: z.number(),
	}),
	auth_tokens: z.object({
		total_refresh_tokens: z.number(),
		active_tokens: z.number(),
		revoked_tokens: z.number(),
		expired_tokens: z.number(),
	}),
	ai_stats: z.object({
		ai_exams_count: z.number(),
		estimated_prompt_tokens: z.number(),
		estimated_completion_tokens: z.number(),
		estimated_total_tokens: z.number(),
		vector_points_count: z.number(),
		vector_status: z.string(),
	}),
	data_volumes: z.object({
		total_subjects: z.number(),
		total_exams: z.number(),
		published_exams: z.number(),
		draft_exams: z.number(),
		total_questions: z.number(),
		total_answers: z.number(),
		total_attempts: z.number(),
		total_user_answers: z.number(),
	}),
});
