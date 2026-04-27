import { StatusCodes } from "http-status-codes";
import { v7 as uuidv7 } from "uuid";
import type { Answer } from "@/api/answers/answer.model";
import { AnswerRepository } from "@/api/answers/answer.repository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";

export class AnswerService {
	private answerRepository: AnswerRepository;

	constructor(repository: AnswerRepository = new AnswerRepository()) {
		this.answerRepository = repository;
	}

	async getAll(): Promise<ServiceResponse<Answer[] | null>> {
		try {
			const answers = await this.answerRepository.getAll();
			if (!answers || answers.length === 0) {
				return ServiceResponse.failure("No Answers found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<Answer[]>("Answers found", answers);
		} catch (error) {
			const errorMessage = `Error finding all answers: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while retrieving answers.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async getById(id: string): Promise<ServiceResponse<Answer | null>> {
		try {
			const answer = await this.answerRepository.getById(id);
			if (!answer) {
				return ServiceResponse.failure("Answer not found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<Answer>("Answer found", answer);
		} catch (error) {
			const errorMessage = `Error finding answer with id ${id}: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while finding answer.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async deleteById(id: string): Promise<ServiceResponse<number | null>> {
		try {
			const answer = await this.answerRepository.deleteById(id);
			if (!answer) {
				return ServiceResponse.failure("Answer not found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<number>("Answer deleted", answer);
		} catch (error) {
			const errorMessage = `Error deleting answer with id ${id}: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while deleting an answer.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async createAnswer(
		question_id: string,
		content: string,
		is_correct: boolean,
	): Promise<ServiceResponse<Answer | null>> {
		try {
			const id = uuidv7();
			const newAnswer = await this.answerRepository.createAnswer(id, question_id, content, is_correct);
			return ServiceResponse.success<Answer>("Answer created successfully", newAnswer);
		} catch (error) {
			const errorMessage = `Error creating answer: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while creating an answer.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async updateAnswer(id: string, payload: Partial<Omit<Answer, "id">>): Promise<ServiceResponse<Answer | null>> {
		try {
			const existingAnswer = await this.answerRepository.getById(id);
			if (!existingAnswer) {
				return ServiceResponse.failure("Answer not found", null, StatusCodes.NOT_FOUND);
			}
			await this.answerRepository.updateAnswer(id, payload);
			const updatedAnswer = await this.answerRepository.getById(id);
			return ServiceResponse.success<Answer>("Answer updated successfully", updatedAnswer as Answer);
		} catch (error) {
			const errorMessage = `Error updating answer with id ${id}: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while updating an answer.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}
}

export const answerService = new AnswerService();
