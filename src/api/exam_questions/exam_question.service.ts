import { StatusCodes } from "http-status-codes";
import { v7 as uuidv7 } from "uuid";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import type { ExamQuestion } from "./exam_question.model";
import { ExamQuestionRepository } from "./exam_question.repository";

export class ExamQuestionService {
	private examQuestionRepository: ExamQuestionRepository;

	constructor(repository: ExamQuestionRepository = new ExamQuestionRepository()) {
		this.examQuestionRepository = repository;
	}

	// Retrieves all exam questions from the database
	async getAll(): Promise<ServiceResponse<ExamQuestion[] | null>> {
		try {
			const result = await this.examQuestionRepository.getAll();
			if (!result || result.length === 0) {
				return ServiceResponse.failure("No Exam Questions found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<ExamQuestion[]>("Exam Questions found", result);
		} catch (error) {
			const errorMessage = `Error finding all exam questions: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while retrieving exam questions.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	// Retrieves a single exam question by its ID
	async getById(id: string): Promise<ServiceResponse<ExamQuestion | null>> {
		try {
			const result = await this.examQuestionRepository.getById(id);
			if (!result) {
				return ServiceResponse.failure("Exam Question not found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<ExamQuestion>("Exam Question found", result);
		} catch (error) {
			const errorMessage = `Error finding exam question with id ${id}: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while finding exam question.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async deleteById(id: string): Promise<ServiceResponse<number | null>> {
		try {
			const result = await this.examQuestionRepository.deleteById(id);
			if (!result) {
				return ServiceResponse.failure("Exam Question not found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<number>("Exam Question deleted", result);
		} catch (error) {
			const errorMessage = `Error finding exam question with id ${id}: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while deleting an exam question.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async createExamQuestion(exam_id: string, question_id: string): Promise<ServiceResponse<number | null>> {
		try {
			const id = uuidv7();
			const newExamQuestion = await this.examQuestionRepository.createExamQuestion(id, exam_id, question_id);
			return ServiceResponse.success<number>("Exam Question created successfully", newExamQuestion);
		} catch (error) {
			const errorMessage = `Error creating exam question: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while creating an exam question.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async updateExamQuestion(id: string, payload: Partial<Omit<ExamQuestion, "id">>): Promise<ServiceResponse<ExamQuestion | null>> {
		try {
			const existingExamQuestion = await this.examQuestionRepository.getById(id);
			if (!existingExamQuestion) {
				return ServiceResponse.failure("Exam Question not found", null, StatusCodes.NOT_FOUND);
			}
			await this.examQuestionRepository.updateExamQuestion(id, payload);
			const updatedExamQuestion = await this.examQuestionRepository.getById(id);
			return ServiceResponse.success<ExamQuestion>("Exam Question updated successfully", updatedExamQuestion as ExamQuestion);
		} catch (error) {
			const errorMessage = `Error updating exam question with id ${id}: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while updating an exam question.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}
}

export const examQuestionService = new ExamQuestionService();
