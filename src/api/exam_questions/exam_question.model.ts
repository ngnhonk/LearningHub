import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type ExamQuestion = z.infer<typeof ExamQuestionSchema>;
export const ExamQuestionSchema = z.object({
	id: commonValidations.id,
	exam_id: commonValidations.id,
	question_id: commonValidations.id,
});

// Input Validation for 'GET exam-questions/:id' endpoint
export const GetExamQuestionSchema = z.object({
	params: z.object({ id: commonValidations.id }),
});

export const CreateExamQuestionSchema = z.object({
	body: z.object({
		exam_id: commonValidations.id,
		question_id: commonValidations.id,
	}),
});

export const UpdateExamQuestionSchema = z.object({
	params: z.object({ id: commonValidations.id }),
	body: z.object({
		exam_id: commonValidations.id.optional(),
		question_id: commonValidations.id.optional(),
	}),
});

export const DeleteExamQuestionSchema = z.object({
	params: z.object({ id: commonValidations.id }),
});

export const GetExamQuestionResponseSchema = GetExamQuestionSchema;
