import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type Answer = z.infer<typeof AnswerSchema>;
export const AnswerSchema = z.object({
	id: commonValidations.id,
	question_id: commonValidations.id,
	content: commonValidations.text,
	is_correct: commonValidations.true_false.default(false),
});

// Input Validation for 'GET answers/:id' endpoint
export const GetAnswerSchema = z.object({
	params: z.object({ id: commonValidations.id }),
});

export const CreateAnswerSchema = z.object({
	body: z.object({
		question_id: commonValidations.id,
		content: commonValidations.text,
		is_correct: commonValidations.true_false.default(false),
	}),
});

export const UpdateAnswerSchema = z.object({
	params: z.object({ id: commonValidations.id }),
	body: z.object({
		content: commonValidations.text.optional(),
		is_correct: commonValidations.true_false.optional(),
	}),
});

export const DeleteAnswerSchema = z.object({
	params: z.object({ id: commonValidations.id }),
});

export const GetAnswerResponseSchema = AnswerSchema;
