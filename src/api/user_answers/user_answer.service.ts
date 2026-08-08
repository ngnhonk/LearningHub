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

	// Helper to sanitize UserAnswer response when attempt is in_progress
	private sanitizeAnswer(userAnswer: UserAnswer, hideCorrectness: boolean): any {
		if (hideCorrectness) {
			const { is_correct, ...rest } = userAnswer;
			return rest;
		}
		return userAnswer;
	}

	// Submit an answer - auto-checks if the selected answer is correct
	async createUserAnswer(
		userId: string,
		attempId: string,
		questionId: string,
		selectedAnswerId: string,
		userRole?: string,
	): Promise<ServiceResponse<any | null>> {
		try {
			// Check if attempt exists and is in_progress
			const attempt = await this.attemptRepository.getById(attempId);
			if (!attempt) {
				return ServiceResponse.failure("Exam attempt not found", null, StatusCodes.NOT_FOUND);
			}
			if (attempt.user_id !== userId && userRole !== "admin") {
				return ServiceResponse.failure("Forbidden - You do not own this exam attempt", null, StatusCodes.FORBIDDEN);
			}
			if (attempt.status !== "in_progress") {
				return ServiceResponse.failure(
					"Cannot submit answers for an attempt that is not in progress",
					null,
					StatusCodes.BAD_REQUEST,
				);
			}

			// Check if selected answer exists and belongs to the question
			const selectedAnswer = await this.answerRepository.getById(selectedAnswerId);
			if (!selectedAnswer) {
				return ServiceResponse.failure("Selected answer not found", null, StatusCodes.NOT_FOUND);
			}
			if (selectedAnswer.question_id !== questionId) {
				return ServiceResponse.failure("Selected answer does not belong to the specified question", null, StatusCodes.BAD_REQUEST);
			}

			// Auto-check if the selected answer is correct
			const isCorrect = Boolean(selectedAnswer.is_correct);

			const id = uuidv7();
			const userAnswerData: UserAnswer = {
				id,
				attemp_id: attempId,
				question_id: questionId,
				selected_answer_id: selectedAnswerId,
				is_correct: isCorrect,
				answered_at: new Date(),
			};

			const saved = await this.userAnswerRepository.upsertUserAnswer(userAnswerData);
			const responseData = this.sanitizeAnswer(saved, attempt.status === "in_progress");

			return ServiceResponse.success<any>("Answer submitted successfully", responseData);
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
	async updateUserAnswer(
		userId: string,
		id: string,
		selectedAnswerId: string,
		userRole?: string,
	): Promise<ServiceResponse<any | null>> {
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
			if (attempt.user_id !== userId && userRole !== "admin") {
				return ServiceResponse.failure("Forbidden - You do not own this exam attempt", null, StatusCodes.FORBIDDEN);
			}

			// Check if the new selected answer exists and belongs to the question
			const selectedAnswer = await this.answerRepository.getById(selectedAnswerId);
			if (!selectedAnswer) {
				return ServiceResponse.failure("Selected answer not found", null, StatusCodes.NOT_FOUND);
			}
			if (selectedAnswer.question_id !== existingAnswer.question_id) {
				return ServiceResponse.failure("Selected answer does not belong to the question", null, StatusCodes.BAD_REQUEST);
			}

			// Re-check correctness
			const isCorrect = Boolean(selectedAnswer.is_correct);

			await this.userAnswerRepository.updateUserAnswer(id, {
				selected_answer_id: selectedAnswerId,
				is_correct: isCorrect,
				answered_at: new Date(),
			});

			const updatedAnswer = await this.userAnswerRepository.getById(id);
			const responseData = this.sanitizeAnswer(updatedAnswer as UserAnswer, attempt.status === "in_progress");

			return ServiceResponse.success<any>("Answer updated successfully", responseData);
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

	// Save multiple user answers in batch for an attempt
	async saveBatchUserAnswers(
		userId: string,
		attempId: string,
		answers: Array<{ question_id: string; selected_answer_id: string }>,
		userRole?: string,
	): Promise<ServiceResponse<any | null>> {
		try {
			const attempt = await this.attemptRepository.getById(attempId);
			if (!attempt) {
				return ServiceResponse.failure("Exam attempt not found", null, StatusCodes.NOT_FOUND);
			}
			if (attempt.user_id !== userId && userRole !== "admin") {
				return ServiceResponse.failure("Forbidden - You do not own this exam attempt", null, StatusCodes.FORBIDDEN);
			}
			if (attempt.status !== "in_progress") {
				return ServiceResponse.failure(
					"Cannot submit answers for an attempt that is not in progress",
					null,
					StatusCodes.BAD_REQUEST,
				);
			}

			const savedAnswers = [];
			for (const item of answers) {
				const selectedAnswer = await this.answerRepository.getById(item.selected_answer_id);
				if (!selectedAnswer || selectedAnswer.question_id !== item.question_id) {
					continue;
				}

				const isCorrect = Boolean(selectedAnswer.is_correct);
				const data: UserAnswer = {
					id: uuidv7(),
					attemp_id: attempId,
					question_id: item.question_id,
					selected_answer_id: item.selected_answer_id,
					is_correct: isCorrect,
					answered_at: new Date(),
				};
				const saved = await this.userAnswerRepository.upsertUserAnswer(data);
				savedAnswers.push(this.sanitizeAnswer(saved, true));
			}

			return ServiceResponse.success<any>("Batch answers saved successfully", savedAnswers);
		} catch (error) {
			const errorMessage = `Error saving batch user answers for attempt ${attempId}: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while saving batch answers.",
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

