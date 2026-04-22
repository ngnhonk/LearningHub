import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { commonValidations } from "@/common/utils/commonValidation";
import { UserSchema } from "../user/user.model";

extendZodWithOpenApi(z);

export type RefreshToken = z.infer<typeof TokenSchema>;
export const TokenSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    hashed_token: z.string(),
    expires_at: z.date(),
    revoked: z.boolean(),
    device_info: z.string(),
});

export type Auth = z.infer<typeof AuthSchema>;
export const AuthSchema = z.object({
    id: z.string(),
    username: z.string().min(2).max(100),
    email: z.string().email(),
    create_time: z.date(),
});

export const LoginSchema = z.object({
    body: z.object({
        identify: commonValidations.identify,
        password: commonValidations.password,
    }),
});

export const LoginResponseSchema = z.object({
    message: z.string(),
    user: AuthSchema,
});

export const RegisterSchema = z.object({
    body: z.object({
        full_name: commonValidations.name,
        username: commonValidations.name,
        email: commonValidations.email,
        password: commonValidations.password,
    }),
});
export const RegisterResponseSchema = z.object({
    message: z.string(),
    user: AuthSchema,
});

export const GetAccessTokenResponseSchema = z.object({
    accessToken: z.string(),
});


export const CompleteRegisterResponseSchema = z.object({
    id: z.number(),
});
export const CompleteRegisterSchema = z.object({
    body: z.object({
        email: commonValidations.email,
        otp: commonValidations.otp_code,
        tempToken: z.string(),
    }),
});

export const GetAccessTokenSchema = z.object({
    body: z.object({
        refreshToken: z.string(),
    }),
});
export const GetAccessTokenResponsechema = z.object({
    accessToken: z.string(),
});

export const InitResetPasswordSchema = z.object({
    body: z.object({
        email: commonValidations.email,
    }),
});

export const CompleteResetPasswordSchema = z.object({
    body: z.object({
        email: commonValidations.email,
        otp: commonValidations.otp_code,
        tempToken: z.string(),
        password: commonValidations.password,
    }),
});

export const InitRegisterResponseSchema = z.object({
    email: commonValidations.email,
    tempToken: z.string(),
});
