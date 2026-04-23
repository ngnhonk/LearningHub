import { z } from "zod";

export const commonValidations = {
	id: z
		.string({
			required_error: "ID cannot be empty",
			invalid_type_error: "ID must be a string",
		})
		.length(36, "ID must be exactly 36 characters"),

	text: z
		.string({
			required_error: "Text cannot be empty",
			invalid_type_error: "Text must be a string",
		})
		.refine((val) => val.trim().length > 0, {
			message: "Text cannot be empty",
		}),

	identify: z
		.string({
			required_error: "Email or Username cannot be empty",
			invalid_type_error: "Email or Username must be a string",
		})
		.refine(
			(val) => {
				const isEmail = z.string().email().safeParse(val).success;
				const isUsername = /^[a-zA-Z0-9_]+$/.test(val);
				return isEmail || isUsername;
			},
			{
				message: "Identify must be a valid email or username",
			},
		),
	email: z
		.string({
			required_error: "Email cannot be empty",
			invalid_type_error: "Email must be a string",
		})
		.email("Invalid email format"),

	name: z
		.string({
			required_error: "Name cannot be empty",
			invalid_type_error: "Name must be a string",
		})
		.min(2, "Name must be at least 2 characters")
		.max(50, "Name must not exceed 50 characters"),

	phone: z
		.string({
			required_error: "Phone number cannot be empty",
			invalid_type_error: "Phone number must be a string",
		})
		.length(10, "Phone number must be exactly 10 digits")
		.regex(/^\d+$/, "Phone number must contain only digits"),

	password: z
		.string({
			required_error: "Password cannot be empty",
			invalid_type_error: "Password must be a valid string",
		})
		.min(8, "Password must be at least 8 characters"),

	date_of_birth: z
		.preprocess(
			(arg) => {
				if (typeof arg === "string" || arg instanceof Date)
					return new Date(arg);
				return arg;
			},
			z.date({ required_error: "Date of birth is required" }),
		)
		.refine((date) => date < new Date(), {
			message: "Date of birth must be in the past",
		}),

	role: z.enum(["admin", "user"], {
		errorMap: () => ({
			message: "Role must be either 'user' or 'admin'",
		}),
	}),

	link: z
		.string({
			required_error: "Link cannot be empty",
			invalid_type_error: "Link must be a valid string",
		})
		.url("Invalid URL format"),

	otp_code: z
		.string({
			required_error: "OTP code cannot be empty",
			invalid_type_error: "OTP code must be a string",
		})
		.length(6, "OTP must be exactly 6 digits")
		.regex(/^\d+$/, "OTP must contain only digits"),

	number: z.number({
		required_error: "Number cannot be empty",
		invalid_type_error: "Value must be a number",
	}),

	remember_me: z.boolean({
		required_error: "Remember me is required",
		invalid_type_error: "Remember me must be true or false",
	}),
};
