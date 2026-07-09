import { StatusCodes } from "http-status-codes";
import { v7 as uuidv7 } from "uuid";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import type { UserExamAttempt } from "./user_exam_attempt.model";
import { UserExamAttemptRepository } from "./user_exam_attempt.repository";
import { ExamRepository } from "@/api/exams/exam.repository";
import { UserAnswerRepository } from "@/api/user_answers/user_answer.repository";
import { QuestionRepository } from "@/api/questions/question.repository";
import { AnswerRepository } from "@/api/answers/answer.repository";

export class UserExamAttemptService {
	private attemptRepository: UserExamAttemptRepository;
	private examRepository: ExamRepository;
	private userAnswerRepository: UserAnswerRepository;
	private questionRepository: QuestionRepository;
	private answerRepository: AnswerRepository;

	constructor(
		attemptRepository: UserExamAttemptRepository = new UserExamAttemptRepository(),
		examRepository: ExamRepository = new ExamRepository(),
		userAnswerRepository: UserAnswerRepository = new UserAnswerRepository(),
		questionRepository: QuestionRepository = new QuestionRepository(),
		answerRepository: AnswerRepository = new AnswerRepository(),
	) {
		this.attemptRepository = attemptRepository;
		this.examRepository = examRepository;
		this.userAnswerRepository = userAnswerRepository;
		this.questionRepository = questionRepository;
		this.answerRepository = answerRepository;
	}

	// Retrieves all user exam attempts
	async getAll(): Promise<ServiceResponse<UserExamAttempt[] | null>> {
		try {
			const result = await this.attemptRepository.getAll();
			if (!result || result.length === 0) {
				return ServiceResponse.failure("No User Exam Attempts found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<UserExamAttempt[]>("User Exam Attempts found", result);
		} catch (error) {
			const errorMessage = `Error finding all user exam attempts: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while retrieving user exam attempts.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	// Retrieves a single attempt by its ID
	async getById(id: string): Promise<ServiceResponse<UserExamAttempt | null>> {
		try {
			const result = await this.attemptRepository.getById(id);
			if (!result) {
				return ServiceResponse.failure("User Exam Attempt not found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<UserExamAttempt>("User Exam Attempt found", result);
		} catch (error) {
			const errorMessage = `Error finding user exam attempt with id ${id}: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while finding user exam attempt.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	// Retrieves all attempts by a specific user
	async getByUserId(userId: string): Promise<ServiceResponse<UserExamAttempt[] | null>> {
		try {
			const result = await this.attemptRepository.getByUserId(userId);
			if (!result || result.length === 0) {
				return ServiceResponse.failure("No attempts found for this user", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<UserExamAttempt[]>("User Exam Attempts found", result);
		} catch (error) {
			const errorMessage = `Error finding attempts for user ${userId}: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while retrieving user exam attempts.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	// Retrieves all attempts for a specific exam
	async getByExamId(examId: string): Promise<ServiceResponse<UserExamAttempt[] | null>> {
		try {
			const result = await this.attemptRepository.getByExamId(examId);
			if (!result || result.length === 0) {
				return ServiceResponse.failure("No attempts found for this exam", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<UserExamAttempt[]>("User Exam Attempts found", result);
		} catch (error) {
			const errorMessage = `Error finding attempts for exam ${examId}: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while retrieving exam attempts.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	// Start a new exam attempt
	async startAttempt(userId: string, examId: string): Promise<ServiceResponse<UserExamAttempt | null>> {
		try {
			// Check if exam exists and is published
			const exam = await this.examRepository.getById(examId);
			if (!exam) {
				return ServiceResponse.failure("Exam not found", null, StatusCodes.NOT_FOUND);
			}
			if (!exam.is_published) {
				return ServiceResponse.failure("Exam is not published", null, StatusCodes.BAD_REQUEST);
			}

			// Check if user already has an in_progress attempt for this exam
			const existingAttempt = await this.attemptRepository.getInProgressByUserAndExam(userId, examId);
			if (existingAttempt) {
				return ServiceResponse.failure(
					"User already has an in-progress attempt for this exam",
					null,
					StatusCodes.CONFLICT,
				);
			}

			const id = uuidv7();
			await this.attemptRepository.createAttempt({
				id,
				user_id: userId,
				exam_id: examId,
				status: "in_progress",
				score: 0,
				started_at: new Date(),
				time_spent_seconds: 0,
			});

			const newAttempt = await this.attemptRepository.getById(id);
			return ServiceResponse.success<UserExamAttempt>("Exam attempt started successfully", newAttempt as UserExamAttempt);
		} catch (error) {
			const errorMessage = `Error starting exam attempt: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while starting the exam attempt.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	// Submit an exam attempt
	async submitAttempt(id: string, score: number, timeSpentSeconds: number): Promise<ServiceResponse<UserExamAttempt | null>> {
		try {
			const attempt = await this.attemptRepository.getById(id);
			if (!attempt) {
				return ServiceResponse.failure("User Exam Attempt not found", null, StatusCodes.NOT_FOUND);
			}
			if (attempt.status !== "in_progress") {
				return ServiceResponse.failure(
					"Only in-progress attempts can be submitted",
					null,
					StatusCodes.BAD_REQUEST,
				);
			}

			await this.attemptRepository.updateAttempt(id, {
				status: "submitted",
				score,
				submitted_at: new Date(),
				time_spent_seconds: timeSpentSeconds,
			});

			const updatedAttempt = await this.attemptRepository.getById(id);
			return ServiceResponse.success<UserExamAttempt>("Exam attempt submitted successfully", updatedAttempt as UserExamAttempt);
		} catch (error) {
			const errorMessage = `Error submitting exam attempt with id ${id}: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while submitting the exam attempt.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	// Delete an attempt
	async deleteById(id: string): Promise<ServiceResponse<number | null>> {
		try {
			const result = await this.attemptRepository.deleteById(id);
			if (!result) {
				return ServiceResponse.failure("User Exam Attempt not found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<number>("User Exam Attempt deleted", result);
		} catch (error) {
			const errorMessage = `Error deleting user exam attempt with id ${id}: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while deleting the user exam attempt.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	// Get detailed result of an attempt
	async getAttemptResult(id: string): Promise<ServiceResponse<any | null>> {
		try {
			const attempt = await this.attemptRepository.getById(id);
			if (!attempt) {
				return ServiceResponse.failure("User Exam Attempt not found", null, StatusCodes.NOT_FOUND);
			}
			if (attempt.status === "in_progress") {
				return ServiceResponse.failure(
					"Cannot view result for an in-progress attempt",
					null,
					StatusCodes.BAD_REQUEST,
				);
			}

			// Get all user answers for this attempt
			const userAnswers = await this.userAnswerRepository.getByAttemptId(id);

			// Build detailed results
			const details = await Promise.all(
				userAnswers.map(async (ua) => {
					const question = await this.questionRepository.getById(ua.question_id);
					const selectedAnswer = await this.answerRepository.getById(ua.selected_answer_id);

					// Find the correct answer for this question
					const allAnswers = await this.answerRepository.getByQuestionId(ua.question_id);
					const correctAnswer = allAnswers.find((a) => a.is_correct);

					return {
						question,
						selected_answer: selectedAnswer,
						correct_answer: correctAnswer || null,
						is_correct: ua.is_correct,
					};
				}),
			);

			const correctCount = details.filter((d) => d.is_correct).length;
			const wrongCount = details.filter((d) => !d.is_correct).length;

			return ServiceResponse.success("Attempt result found", {
				attempt,
				total_questions: details.length,
				correct_count: correctCount,
				wrong_count: wrongCount,
				details,
			});
		} catch (error) {
			const errorMessage = `Error getting attempt result for id ${id}: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while retrieving attempt result.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}
}

export const userExamAttemptService = new UserExamAttemptService();
