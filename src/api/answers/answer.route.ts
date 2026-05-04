import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";
import {
	AnswerSchema,
	CreateAnswerSchema,
	DeleteAnswerSchema,
	GetAnswerSchema,
	UpdateAnswerSchema,
} from "@/api/answers/answer.model";
import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { answerController } from "./answer.controller";

export const answerRegistry = new OpenAPIRegistry();
export const answerRouter: Router = express.Router();

answerRegistry.register("Answer", AnswerSchema);

// get all answers
answerRegistry.registerPath({
	method: "get",
	path: "/answers",
	tags: ["Answer"],
	summary: "Get all answers",
	responses: createApiResponse(z.array(AnswerSchema), "Success"),
});

answerRouter.get("/", answerController.getAnswers);

// get answer by id
answerRegistry.registerPath({
	method: "get",
	path: "/answers/{id}",
	tags: ["Answer"],
	summary: "Get an answer by id",
	request: { params: GetAnswerSchema.shape.params },
	responses: createApiResponse(AnswerSchema, "Success"),
});

answerRouter.get("/:id", validateRequest(GetAnswerSchema), answerController.getAnswer);

// create an answer
answerRegistry.registerPath({
	method: "post",
	path: "/answers",
	tags: ["Answer"],
	summary: "Create an answer",
	request: {
		body: {
			content: {
				"application/json": {
					schema: CreateAnswerSchema.shape.body,
				},
			},
		},
	},
	responses: createApiResponse(AnswerSchema, "Success"),
});

answerRouter.post("/", validateRequest(CreateAnswerSchema), answerController.createAnswer);

// update an answer
answerRegistry.registerPath({
	method: "put",
	path: "/answers/{id}",
	tags: ["Answer"],
	summary: "Update an answer",
	request: {
		params: UpdateAnswerSchema.shape.params,
		body: {
			content: {
				"application/json": {
					schema: UpdateAnswerSchema.shape.body,
				},
			},
		},
	},
	responses: createApiResponse(AnswerSchema, "Success"),
});

answerRouter.put("/:id", validateRequest(UpdateAnswerSchema), answerController.updateAnswer);

// delete an answer by id
answerRegistry.registerPath({
	method: "delete",
	path: "/answers/{id}",
	summary: "Delete an answer",
	tags: ["Answer"],
	request: { params: DeleteAnswerSchema.shape.params },
	responses: createApiResponse(z.number(), "Success"),
});

answerRouter.delete("/:id", validateRequest(DeleteAnswerSchema), answerController.deleteAnswer);
