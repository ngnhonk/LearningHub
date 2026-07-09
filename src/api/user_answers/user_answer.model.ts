import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type UserAnswer = z.infer<typeof UserAnswerSchema>;
export const UserAnswerSchema = z.object({
	id: commonValidations.id,
	attemp_id: commonValidations.id,
	question_id: commonValidations.id,
	selected_answer_id: commonValidations.id,
	is_correct: commonValidations.true_false,
	answered_at: commonValidations.date,
});

// Input Validation for 'GET user-answers/:id' endpoint
export const GetUserAnswerSchema = z.object({
	params: z.object({ id: commonValidations.id }),
});

// Input Validation for 'GET user-answers/attempt/:attempId'
export const GetByAttemptIdSchema = z.object({
	params: z.object({ attempId: commonValidations.id }),
});

// Input Validation for 'POST user-answers' - submit an answer
export const CreateUserAnswerSchema = z.object({
	body: z.object({
		attemp_id: commonValidations.id,
		question_id: commonValidations.id,
		selected_answer_id: commonValidations.id,
	}),
});

// Input Validation for 'PUT user-answers/:id' - update selected answer
export const UpdateUserAnswerSchema = z.object({
	params: z.object({ id: commonValidations.id }),
	body: z.object({
		selected_answer_id: commonValidations.id,
	}),
});

export const DeleteUserAnswerSchema = z.object({
	params: z.object({ id: commonValidations.id }),
});
