import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";
import { GetSubjectSchema, SubjectSchema, CreateSubjectSchema, UpdateSubjectSchema, DeleteSubjectSchema } from "@/api/subject/subject.model";
import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { subjectController } from "./subject.controller";

export const subjectRegistry = new OpenAPIRegistry();
export const subjectRouter: Router = express.Router();

subjectRegistry.register("Subject", SubjectSchema);

subjectRegistry.registerPath({
	method: "get",
	path: "/subjects",
	tags: ["Subject"],
	responses: createApiResponse(z.array(SubjectSchema), "Success"),
});

subjectRouter.get("/", subjectController.getSubjects);

subjectRegistry.registerPath({
	method: "get",
	path: "/subjects/{id}",
	tags: ["Subject"],
	request: { params: GetSubjectSchema.shape.params },
	responses: createApiResponse(SubjectSchema, "Success"),
});

subjectRouter.get("/:id", validateRequest(GetSubjectSchema), subjectController.getSubject);

subjectRegistry.registerPath({
	method: "post",
	path: "/subjects",
	tags: ["Subject"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: CreateSubjectSchema.shape.body,
				},
			},
		},
	},
	responses: createApiResponse(SubjectSchema, "Success"),
});

subjectRouter.post("/", validateRequest(CreateSubjectSchema), subjectController.createSubject);

subjectRegistry.registerPath({
	method: "put",
	path: "/subjects/{id}",
	tags: ["Subject"],
	request: { 
		params: UpdateSubjectSchema.shape.params,
		body: {
			content: {
				"application/json": {
					schema: UpdateSubjectSchema.shape.body,
				},
			},
		},
	},
	responses: createApiResponse(SubjectSchema, "Success"),
});

subjectRouter.put("/:id", validateRequest(UpdateSubjectSchema), subjectController.updateSubject);

subjectRegistry.registerPath({
	method: "delete",
	path: "/subjects/{id}",
	tags: ["Subject"],
	request: { params: DeleteSubjectSchema.shape.params },
	responses: createApiResponse(z.number(), "Success"),
});

subjectRouter.delete("/:id", validateRequest(DeleteSubjectSchema), subjectController.deleteSubject);
