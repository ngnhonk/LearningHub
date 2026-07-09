import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { authRegistry } from "@/api/auth/auth.route";
import { healthCheckRegistry } from "@/api/healthCheck/healthCheckRouter";
import { questionRegistry } from "@/api/questions/question.route";
import { subjectRegistry } from "@/api/subject/subject.route";
import { userRegistry } from "@/api/user/user.route";
import { answerRegistry } from "@/api/answers/answer.route";
import { examQuestionRegistry } from "@/api/exam_questions/exam_question.route";
import { examRegistry } from "@/api/exams/exam.route";
import { userExamAttemptRegistry } from "@/api/user_exam_attempts/user_exam_attempt.route";
export type OpenAPIDocument = ReturnType<OpenApiGeneratorV3["generateDocument"]>;

export function generateOpenAPIDocument(): OpenAPIDocument {
	const registry = new OpenAPIRegistry([
		healthCheckRegistry,
		userRegistry,
		authRegistry,
		subjectRegistry,
		questionRegistry,
		answerRegistry,
		examRegistry,
		examQuestionRegistry,
		userExamAttemptRegistry,
	]);
	registry.registerComponent("securitySchemes", "bearerAuth", {
		type: "http",
		scheme: "bearer",
		bearerFormat: "JWT",
		description: "Enter your JWT token in the format: Bearer <token>",
	});
	const generator = new OpenApiGeneratorV3(registry.definitions);

	return generator.generateDocument({
		openapi: "3.0.0",
		info: {
			version: "1.0.0",
			title: "Swagger API",
		},
		externalDocs: {
			description: "View the raw OpenAPI Specification in JSON format",
			url: "/swagger.json",
		},
		security: [
			{
				bearerAuth: [],
			},
		],
	});
}
