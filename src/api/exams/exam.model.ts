import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type Exam = z.infer<typeof ExamSchema>;
export const ExamSchema = z.object({
	id: commonValidations.id,
	title: commonValidations.text,
	description: commonValidations.text,
	subject_id: commonValidations.id,
	duration_minutes: commonValidations.number,
	total_marks: commonValidations.number,
	pass_percentage: commonValidations.number,
	is_published: commonValidations.true_false,
	created_by: commonValidations.id,
	created_at: commonValidations.date,
});

// Input Validation for 'GET exams/:id' endpoint
export const GetExamSchema = z.object({
	params: z.object({ id: commonValidations.id }),
});

export const CreateExamSchema = z.object({
	body: z.object({
		title: commonValidations.text,
		description: z.string().optional().default(""),
		subject_id: commonValidations.id,
		duration_minutes: commonValidations.number,
		total_marks: commonValidations.number,
		pass_percentage: commonValidations.number,
		is_published: commonValidations.true_false,
	}),
});

export const UpdateExamSchema = z.object({
	params: z.object({ id: commonValidations.id }),
	body: z.object({
		title: commonValidations.text.optional(),
		description: z.string().optional(),
		subject_id: commonValidations.id.optional(),
		duration_minutes: commonValidations.number.optional(),
		total_marks: commonValidations.number.optional(),
		pass_percentage: commonValidations.number.optional(),
		is_published: commonValidations.true_false.optional(),
	}),
});

export const DeleteExamSchema = z.object({
	params: z.object({ id: commonValidations.id }),
});

export const GetExamResponseSchema = GetExamSchema;

export const GetBySubjectIdSchema = z.object({
	params: z.object({ subjectId: commonValidations.id }),
});

export const GetExamDetailSchema = z.object({
	params: z.object({ id: commonValidations.id }),
});
