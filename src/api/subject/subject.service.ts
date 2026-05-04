import crypto from "crypto";
import { StatusCodes } from "http-status-codes";
import { CLIENT_RENEG_LIMIT } from "tls";
import { v7 as uuidv7 } from "uuid";
import type { Subject } from "@/api/subject/subject.model";
import { SubjectRepository } from "@/api/subject/subject.repository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";

export class SubjectService {
	private subjectRepository: SubjectRepository;

	constructor(repository: SubjectRepository = new SubjectRepository()) {
		this.subjectRepository = repository;
	}

	// Retrieves all subjects from the database
	async getAll(): Promise<ServiceResponse<Subject[] | null>> {
		try {
			const subjects = await this.subjectRepository.getAll();
			if (!subjects || subjects.length === 0) {
				return ServiceResponse.failure("No Subjects found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<Subject[]>("Subjects found", subjects);
		} catch (error) {
			const errorMessage = `Error finding all subjects: $${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while retrieving subjects.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	// Retrieves a single subject by their ID
	async getById(id: string): Promise<ServiceResponse<Subject | null>> {
		try {
			const subject = await this.subjectRepository.getById(id);
			if (!subject) {
				return ServiceResponse.failure("Subject not found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<Subject>("Subject found", subject);
		} catch (error) {
			const errorMessage = `Error finding subject with id ${id}:, ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while finding subject.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async deleteById(id: string): Promise<ServiceResponse<number | null>> {
		try {
			const subject = await this.subjectRepository.deleteById(id);
			if (!subject) {
				return ServiceResponse.failure("Subject not found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<number>("Subject deleted", subject);
		} catch (error) {
			const errorMessage = `Error finding subject with id ${id}:, ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while deleting a subject.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async createSubject(name: string, description: string): Promise<ServiceResponse<Subject | null>> {
		try {
			const id = uuidv7();
			const newSubject = await this.subjectRepository.createSubject(id, name, description);
			return ServiceResponse.success<Subject>("Subject created successfully", newSubject);
		} catch (error) {
			const errorMessage = `Error creating subject: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while creating a subject.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async updateSubject(id: string, payload: Partial<Omit<Subject, "id">>): Promise<ServiceResponse<Subject | null>> {
		try {
			const existingSubject = await this.subjectRepository.getById(id);
			if (!existingSubject) {
				return ServiceResponse.failure("Subject not found", null, StatusCodes.NOT_FOUND);
			}
			await this.subjectRepository.updateSubject(id, payload);
			const updatedSubject = await this.subjectRepository.getById(id);
			return ServiceResponse.success<Subject>("Subject updated successfully", updatedSubject as Subject);
		} catch (error) {
			const errorMessage = `Error updating subject with id ${id}: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while updating a subject.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}
}

export const subjectService = new SubjectService();
