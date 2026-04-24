import { StatusCodes } from "http-status-codes";
import type { Subject } from "@/api/subject/subject.model";
import { SubjectRepository } from "@/api/subject/subject.repository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import crypto from "crypto";
import { v7 as uuidv7 } from "uuid";
import { CLIENT_RENEG_LIMIT } from "tls";

export class SubjectService {
  private subjectRepository: SubjectRepository;

  constructor(repository: SubjectRepository = new SubjectRepository()) {
    this.subjectRepository = repository;
  }

  // Retrieves all subjects from the database
  async findAll(): Promise<ServiceResponse<Subject[] | null>> {
    try {
      const subjects = await this.subjectRepository.findAll();
      if (!subjects || subjects.length === 0) {
        return ServiceResponse.failure(
          "No Subjects found",
          null,
          StatusCodes.NOT_FOUND,
        );
      }
      return ServiceResponse.success<Subject[]>("Subjects found", subjects);
    } catch (ex) {
      const errorMessage = `Error finding all subjects: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving subjects.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Retrieves a single subject by their ID
  async findById(id: string): Promise<ServiceResponse<Subject | null>> {
    try {
      const subject = await this.subjectRepository.findById(id);
      if (!subject) {
        return ServiceResponse.failure(
          "Subject not found",
          null,
          StatusCodes.NOT_FOUND,
        );
      }
      return ServiceResponse.success<Subject>("Subject found", subject);
    } catch (ex) {
      const errorMessage = `Error finding subject with id ${id}:, ${(ex as Error).message}`;
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
        return ServiceResponse.failure(
          "Subject not found",
          null,
          StatusCodes.NOT_FOUND,
        );
      }
      return ServiceResponse.success<number>("Subject deleted", subject);
    } catch (ex) {
      const errorMessage = `Error finding subject with id ${id}:, ${(ex as Error).message}`;
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
    } catch (ex) {
      const errorMessage = `Error creating subject: ${(ex as Error).message}`;
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
      const existingSubject = await this.subjectRepository.findById(id);
      if (!existingSubject) {
        return ServiceResponse.failure(
          "Subject not found",
          null,
          StatusCodes.NOT_FOUND,
        );
      }
      await this.subjectRepository.updateSubject(id, payload);
      const updatedSubject = await this.subjectRepository.findById(id);
      return ServiceResponse.success<Subject>("Subject updated successfully", updatedSubject as Subject);
    } catch (ex) {
      const errorMessage = `Error updating subject with id ${id}: ${(ex as Error).message}`;
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
