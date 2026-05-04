import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";
import {
	CreateSubjectSchema,
	DeleteSubjectSchema,
	GetSubjectSchema,
	SubjectSchema,
	UpdateSubjectSchema,
} from "@/api/subject/subject.model";
import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { subjectController } from "./subject.controller";

export const subjectRegistry = new OpenAPIRegistry();
export const subjectRouter: Router = express.Router();

subjectRegistry.register("Subject", SubjectSchema);

// get all subjects
subjectRegistry.registerPath({
	method: "get",
	path: "/subjects",
	tags: ["Subject"],
	summary: "Get all subjects",
	responses: createApiResponse(z.array(SubjectSchema), "Success"),
});

subjectRouter.get("/", subjectController.getSubjects);

// get subject by id
subjectRegistry.registerPath({
	method: "get",
	path: "/subjects/{id}",
	tags: ["Subject"],
	summary: "Get a subject by id",
	request: { params: GetSubjectSchema.shape.params },
	responses: createApiResponse(SubjectSchema, "Success"),
});

subjectRouter.get("/:id", validateRequest(GetSubjectSchema), subjectController.getSubject);

// create a subject
subjectRegistry.registerPath({
	method: "post",
	path: "/subjects",
	tags: ["Subject"],
	summary: "Create a subject",
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

// update a subject
subjectRegistry.registerPath({
	method: "put",
	path: "/subjects/{id}",
	tags: ["Subject"],
	summary: "Update a subject",
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

// delete a subject by id
subjectRegistry.registerPath({
	method: "delete",
	path: "/subjects/{id}",
	summary: "Delete a subject",
	tags: ["Subject"],
	request: { params: DeleteSubjectSchema.shape.params },
	responses: createApiResponse(z.number(), "Success"),
});

subjectRouter.delete("/:id", validateRequest(DeleteSubjectSchema), subjectController.deleteSubject);
