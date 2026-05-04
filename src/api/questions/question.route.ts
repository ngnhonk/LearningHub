import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { questionController } from "./question.controller";
import {
	CreateQuestionSchema,
	DeleteQuestionSchema,
	GetQuestionSchema,
	QuestionSchema,
	UpdateQuestionSchema,
} from "./question.model";

export const questionRegistry = new OpenAPIRegistry();
export const questionRouter: Router = express.Router();

questionRegistry.register("Question", QuestionSchema);

// get all
questionRegistry.registerPath({
	method: "get",
	path: "/questions",
	summary: "Get all questions",
	tags: ["Question"],
	responses: createApiResponse(z.array(QuestionSchema), "Success"),
});

questionRouter.get("/", questionController.getQuestions);

// get one by id
questionRegistry.registerPath({
	method: "get",
	path: "/questions/{id}",
	summary: "Get a question by id",
	tags: ["Question"],
	request: { params: GetQuestionSchema.shape.params },
	responses: createApiResponse(QuestionSchema, "Success"),
});

questionRouter.get("/:id", validateRequest(GetQuestionSchema), questionController.getQuestion);

// create one
questionRegistry.registerPath({
	method: "post",
	path: "/questions",
	tags: ["Question"],
	summary: "Create a question",
	request: {
		body: {
			content: {
				"application/json": {
					schema: CreateQuestionSchema.shape.body,
				},
			},
		},
	},
	responses: createApiResponse(QuestionSchema, "Success"),
});

questionRouter.post("/", validateRequest(CreateQuestionSchema), questionController.createQuestion);

// update a question
questionRegistry.registerPath({
	method: "put",
	path: "/questions/{id}",
	tags: ["Question"],
	summary: "Update a question",
	request: {
		params: UpdateQuestionSchema.shape.params,
		body: {
			content: {
				"application/json": {
					schema: UpdateQuestionSchema.shape.body,
				},
			},
		},
	},
	responses: createApiResponse(QuestionSchema, "Success"),
});

questionRouter.put("/:id", validateRequest(UpdateQuestionSchema), questionController.updateQuestion);

// delete a question by id
questionRegistry.registerPath({
	method: "delete",
	path: "/questions/{id}",
	summary: "Delete a question by id",
	tags: ["Question"],
	request: { params: DeleteQuestionSchema.shape.params },
	responses: createApiResponse(z.number(), "Success"),
});

questionRouter.delete("/:id", validateRequest(DeleteQuestionSchema), questionController.deleteQuestion);
