import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type User = z.infer<typeof UserSchema>;
export const UserSchema = z.object({
	id: z.string(),
	email: z.string().email(),
	full_name: z.string(),
	username: z.string().min(2).max(100),
	hashed_password: z.string(),
	role: z.enum(["student", "admin"]),
	avatar_url: z.string(),
	create_at: z.date(),
});

// Input Validation for 'GET users/:id' endpoint
export const GetUserSchema = z.object({
	params: z.object({ id: commonValidations.id }),
});

export const GetUserResponseSchema = UserSchema;
