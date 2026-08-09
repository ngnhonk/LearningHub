import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export const userExamAttemptStatus = z.enum(["in_progress", "submitted", "time_out"], {
	errorMap: () => ({
		message: "Status must be either 'in_progress', 'submitted', or 'time_out'",
	}),
});

export type UserExamAttempt = z.infer<typeof UserExamAttemptSchema>;
export const UserExamAttemptSchema = z.object({
	id: commonValidations.id,
	user_id: commonValidations.id,
	exam_id: commonValidations.id,
	status: userExamAttemptStatus,
	score: commonValidations.number,
	started_at: commonValidations.date,
	submitted_at: commonValidations.date.nullable(),
	time_spent_seconds: commonValidations.number,
});

// Input Validation for 'GET user-exam-attempts/:id' endpoint
export const GetUserExamAttemptSchema = z.object({
	params: z.object({ id: commonValidations.id }),
});

// Input Validation for 'GET user-exam-attempts/user/:userId'
export const GetByUserIdSchema = z.object({
	params: z.object({ userId: commonValidations.id }),
});

// Input Validation for 'GET user-exam-attempts/exam/:examId'
export const GetByExamIdSchema = z.object({
	params: z.object({ examId: commonValidations.id }),
});

// Input Validation for 'GET user-exam-attempts/active/:examId'
export const GetActiveAttemptSchema = z.object({
	params: z.object({ examId: commonValidations.id }),
});

// Input Validation for 'POST user-exam-attempts/start'
export const StartAttemptSchema = z.object({
	body: z.object({
		exam_id: commonValidations.id,
	}),
});

// Input Validation for 'POST user-exam-attempts/:id/answers' (Batch Save)
export const BatchSaveAnswersSchema = z.object({
	params: z.object({ id: commonValidations.id }),
	body: z.object({
		answers: z.array(
			z.object({
				question_id: commonValidations.id,
				selected_answer_id: commonValidations.id,
			}),
		),
	}),
});

// Input Validation for 'PUT user-exam-attempts/:id/submit'
export const SubmitAttemptSchema = z.object({
	params: z.object({ id: commonValidations.id }),
	body: z
		.object({
			time_spent_seconds: commonValidations.number.optional(),
			answers: z
				.array(
					z.object({
						question_id: commonValidations.id,
						selected_answer_id: commonValidations.id,
					}),
				)
				.optional(),
		})
		.optional(),
});

export const DeleteUserExamAttemptSchema = z.object({
	params: z.object({ id: commonValidations.id }),
});

