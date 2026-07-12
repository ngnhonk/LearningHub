import { StatusCodes } from "http-status-codes";
import { v7 as uuidv7 } from "uuid";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import type { UserAnswer } from "./user_answer.model";
import { UserAnswerRepository } from "./user_answer.repository";
import { UserExamAttemptRepository } from "@/api/user_exam_attempts/user_exam_attempt.repository";
import { AnswerRepository } from "@/api/answers/answer.repository";

export class UserAnswerService {
	private userAnswerRepository: UserAnswerRepository;
	private attemptRepository: UserExamAttemptRepository;
	private answerRepository: AnswerRepository;

	constructor(
		userAnswerRepository: UserAnswerRepository = new UserAnswerRepository(),
		attemptRepository: UserExamAttemptRepository = new UserExamAttemptRepository(),
		answerRepository: AnswerRepository = new AnswerRepository(),
	) {
		this.userAnswerRepository = userAnswerRepository;
		this.attemptRepository = attemptRepository;
		this.answerRepository = answerRepository;
	}

	// Retrieves all user answers
	async getAll(): Promise<ServiceResponse<UserAnswer[] | null>> {
		try {
			const result = await this.userAnswerRepository.getAll();
			if (!result || result.length === 0) {
				return ServiceResponse.failure("No User Answers found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<UserAnswer[]>("User Answers found", result);
		} catch (error) {
			const errorMessage = `Error finding all user answers: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while retrieving user answers.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	// Retrieves a single user answer by ID
	async getById(id: string): Promise<ServiceResponse<UserAnswer | null>> {
		try {
			const result = await this.userAnswerRepository.getById(id);
			if (!result) {
				return ServiceResponse.failure("User Answer not found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<UserAnswer>("User Answer found", result);
		} catch (error) {
			const errorMessage = `Error finding user answer with id ${id}: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while finding user answer.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	// Retrieves all answers for a specific attempt
	async getByAttemptId(attempId: string): Promise<ServiceResponse<UserAnswer[] | null>> {
		try {
			const result = await this.userAnswerRepository.getByAttemptId(attempId);
			if (!result || result.length === 0) {
				return ServiceResponse.failure("No answers found for this attempt", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<UserAnswer[]>("User Answers found", result);
		} catch (error) {
			const errorMessage = `Error finding answers for attempt ${attempId}: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while retrieving user answers.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	// Submit an answer - auto-checks if the selected answer is correct
	async createUserAnswer(
		attempId: string,
		questionId: string,
		selectedAnswerId: string,
	): Promise<ServiceResponse<UserAnswer | null>> {
		try {
			// Check if attempt exists and is in_progress
			const attempt = await this.attemptRepository.getById(attempId);
			if (!attempt) {
				return ServiceResponse.failure("Exam attempt not found", null, StatusCodes.NOT_FOUND);
			}
			if (attempt.status !== "in_progress") {
				return ServiceResponse.failure(
					"Cannot submit answers for an attempt that is not in progress",
					null,
					StatusCodes.BAD_REQUEST,
				);
			}

			// Check if user already answered this question in this attempt
			const existingAnswer = await this.userAnswerRepository.getByAttemptAndQuestion(attempId, questionId);
			if (existingAnswer) {
				return ServiceResponse.failure(
					"User has already answered this question in this attempt. Use update instead.",
					null,
					StatusCodes.CONFLICT,
				);
			}

			// Check if selected answer exists
			const selectedAnswer = await this.answerRepository.getById(selectedAnswerId);
			if (!selectedAnswer) {
				return ServiceResponse.failure("Selected answer not found", null, StatusCodes.NOT_FOUND);
			}

			// Auto-check if the selected answer is correct
			const isCorrect = selectedAnswer.is_correct;

			const id = uuidv7();
			const userAnswer: UserAnswer = {
				id,
				attemp_id: attempId,
				question_id: questionId,
				selected_answer_id: selectedAnswerId,
				is_correct: isCorrect,
				answered_at: new Date(),
			};

			await this.userAnswerRepository.createUserAnswer(userAnswer);
			return ServiceResponse.success<UserAnswer>("Answer submitted successfully", userAnswer);
		} catch (error) {
			const errorMessage = `Error creating user answer: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while submitting the answer.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	// Update a user's answer - re-checks correctness with new selected answer
	async updateUserAnswer(id: string, selectedAnswerId: string): Promise<ServiceResponse<UserAnswer | null>> {
		try {
			const existingAnswer = await this.userAnswerRepository.getById(id);
			if (!existingAnswer) {
				return ServiceResponse.failure("User Answer not found", null, StatusCodes.NOT_FOUND);
			}

			// Check if the attempt is still in_progress
			const attempt = await this.attemptRepository.getById(existingAnswer.attemp_id);
			if (!attempt || attempt.status !== "in_progress") {
				return ServiceResponse.failure(
					"Cannot update answers for an attempt that is not in progress",
					null,
					StatusCodes.BAD_REQUEST,
				);
			}

			// Check if the new selected answer exists
			const selectedAnswer = await this.answerRepository.getById(selectedAnswerId);
			if (!selectedAnswer) {
				return ServiceResponse.failure("Selected answer not found", null, StatusCodes.NOT_FOUND);
			}

			// Re-check correctness
			const isCorrect = selectedAnswer.is_correct;

			await this.userAnswerRepository.updateUserAnswer(id, {
				selected_answer_id: selectedAnswerId,
				is_correct: isCorrect,
				answered_at: new Date(),
			});

			const updatedAnswer = await this.userAnswerRepository.getById(id);
			return ServiceResponse.success<UserAnswer>("Answer updated successfully", updatedAnswer as UserAnswer);
		} catch (error) {
			const errorMessage = `Error updating user answer with id ${id}: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while updating the answer.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	// Delete a user answer
	async deleteById(id: string): Promise<ServiceResponse<number | null>> {
		try {
			const result = await this.userAnswerRepository.deleteById(id);
			if (!result) {
				return ServiceResponse.failure("User Answer not found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<number>("User Answer deleted", result);
		} catch (error) {
			const errorMessage = `Error deleting user answer with id ${id}: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while deleting the user answer.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}
}

export const userAnswerService = new UserAnswerService();
