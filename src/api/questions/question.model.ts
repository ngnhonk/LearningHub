import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type Question = z.infer<typeof QuestionSchema>;
export const QuestionSchema = z.object({
  id: commonValidations.id,
  content: commonValidations.text,
  created_by: commonValidations.id,
  created_at: commonValidations.date,
});

// Input Validation for 'GET subjects/:id' endpoint
export const GetQuestionSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

export const CreateQuestionSchema = z.object({
  body: z.object({
    content: commonValidations.text,
    created_by: commonValidations.id,
  }),
});

export const UpdateQuestionSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    content: commonValidations.text,
  }),
});

export const DeleteQuestionSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

export const GetQuestionResponseSchema = GetQuestionSchema;
