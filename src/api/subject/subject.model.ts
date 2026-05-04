import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type Subject = z.infer<typeof SubjectSchema>;
export const SubjectSchema = z.object({
	id: commonValidations.id,
	name: commonValidations.name,
	description: commonValidations.text.optional(),
});

// Input Validation for 'GET subjects/:id' endpoint
export const GetSubjectSchema = z.object({
	params: z.object({ id: commonValidations.id }),
});

export const CreateSubjectSchema = z.object({
	body: z.object({
		name: commonValidations.name,
		description: commonValidations.text.optional(),
	}),
});

export const UpdateSubjectSchema = z.object({
	params: z.object({ id: commonValidations.id }),
	body: z.object({
		name: commonValidations.name,
		description: commonValidations.text.optional(),
	}),
});

export const DeleteSubjectSchema = z.object({
	params: z.object({ id: commonValidations.id }),
});

export const GetSubjectResponseSchema = SubjectSchema;
