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
import { ExamQuestionRepository } from "@/api/exam_questions/exam_question.repository";
import { userAnswerService } from "@/api/user_answers/user_answer.service";

export class UserExamAttemptService {
	private attemptRepository: UserExamAttemptRepository;
	private examRepository: ExamRepository;
	private userAnswerRepository: UserAnswerRepository;
	private questionRepository: QuestionRepository;
	private answerRepository: AnswerRepository;
	private examQuestionRepository: ExamQuestionRepository;

	constructor(
		attemptRepository: UserExamAttemptRepository = new UserExamAttemptRepository(),
		examRepository: ExamRepository = new ExamRepository(),
		userAnswerRepository: UserAnswerRepository = new UserAnswerRepository(),
		questionRepository: QuestionRepository = new QuestionRepository(),
		answerRepository: AnswerRepository = new AnswerRepository(),
		examQuestionRepository: ExamQuestionRepository = new ExamQuestionRepository(),
	) {
		this.attemptRepository = attemptRepository;
		this.examRepository = examRepository;
		this.userAnswerRepository = userAnswerRepository;
		this.questionRepository = questionRepository;
		this.answerRepository = answerRepository;
		this.examQuestionRepository = examQuestionRepository;
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

	// Retrieves a single attempt by its ID with ownership validation
	async getById(id: string, userId?: string, userRole?: string): Promise<ServiceResponse<UserExamAttempt | null>> {
		try {
			const result = await this.attemptRepository.getById(id);
			if (!result) {
				return ServiceResponse.failure("User Exam Attempt not found", null, StatusCodes.NOT_FOUND);
			}
			if (userId && result.user_id !== userId && userRole !== "admin") {
				return ServiceResponse.failure("Forbidden - You do not own this exam attempt", null, StatusCodes.FORBIDDEN);
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

	// Retrieves all attempts by a specific user with ownership check
	async getByUserId(targetUserId: string, requestingUserId?: string, userRole?: string): Promise<ServiceResponse<UserExamAttempt[] | null>> {
		try {
			const finalUserId = targetUserId === "me" ? requestingUserId : targetUserId;
			if (!finalUserId) {
				return ServiceResponse.failure("Invalid user id", null, StatusCodes.BAD_REQUEST);
			}
			if (requestingUserId && finalUserId !== requestingUserId && userRole !== "admin") {
				return ServiceResponse.failure("Forbidden - Cannot view attempts of another user", null, StatusCodes.FORBIDDEN);
			}

			const result = await this.attemptRepository.getByUserId(finalUserId);
			if (!result || result.length === 0) {
				return ServiceResponse.failure("No attempts found for this user", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<UserExamAttempt[]>("User Exam Attempts found", result);
		} catch (error) {
			const errorMessage = `Error finding attempts for user ${targetUserId}: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while retrieving user exam attempts.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	// Retrieves active in-progress attempt for an exam along with questions and saved user answers
	async getActiveAttempt(userId: string, examId: string): Promise<ServiceResponse<any | null>> {
		try {
			const attempt = await this.attemptRepository.getInProgressByUserAndExam(userId, examId);
			if (!attempt) {
				return ServiceResponse.failure("No active in-progress attempt for this exam", null, StatusCodes.NOT_FOUND);
			}

			// BUG #7: Auto-submit if time is up
			const exam = await this.examRepository.getById(examId);
			const durationSeconds = (exam?.duration_minutes || 60) * 60;
			const elapsed = Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000);
			if (elapsed > durationSeconds + 60) {
				await this.submitAttempt(attempt.id, userId, undefined, undefined, undefined);
				return ServiceResponse.failure("Attempt has timed out and was auto-submitted", null, StatusCodes.BAD_REQUEST);
			}

			const examQuestions = await this.examQuestionRepository.getQuestionsByExamId(examId);
			const questions = await Promise.all(
				examQuestions.map(async (eq) => {
					const question = await this.questionRepository.getById(eq.question_id);
					const answers = await this.answerRepository.getByQuestionId(eq.question_id);
					const sanitizedAnswers = answers.map(({ is_correct, ...rest }) => rest);
					return {
						...question,
						answers: sanitizedAnswers,
					};
				}),
			);

			const rawSavedAnswers = await this.userAnswerRepository.getByAttemptId(attempt.id);
			const savedAnswers = rawSavedAnswers.map(({ is_correct, ...rest }) => rest);

			// BUG #3: Include exam metadata so client can calculate remaining time
			return ServiceResponse.success("Active attempt found", {
				attempt,
				exam,
				questions,
				saved_answers: savedAnswers,
			});
		} catch (error) {
			const errorMessage = `Error retrieving active attempt for user ${userId} and exam ${examId}: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while retrieving active attempt.",
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

	// Start a new exam attempt or return existing active attempt
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
				return ServiceResponse.success<UserExamAttempt>(
					"Retrieved existing in-progress attempt",
					existingAttempt,
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
				submitted_at: null,
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

	// Submit an exam attempt with server-side auto grading and timeout enforcement
	async submitAttempt(
		id: string,
		userId: string,
		timeSpentSecondsParam?: number,
		answersBatch?: Array<{ question_id: string; selected_answer_id: string }>,
		userRole?: string,
	): Promise<ServiceResponse<UserExamAttempt | null>> {
		try {
			const attempt = await this.attemptRepository.getById(id);
			if (!attempt) {
				return ServiceResponse.failure("User Exam Attempt not found", null, StatusCodes.NOT_FOUND);
			}
			if (attempt.user_id !== userId && userRole !== "admin") {
				return ServiceResponse.failure("Forbidden - You do not own this exam attempt", null, StatusCodes.FORBIDDEN);
			}
			if (attempt.status !== "in_progress") {
				return ServiceResponse.failure(
					"Only in-progress attempts can be submitted",
					null,
					StatusCodes.BAD_REQUEST,
				);
			}

			// If answers batch is provided, save them first
			if (answersBatch && answersBatch.length > 0) {
				await userAnswerService.saveBatchUserAnswers(userId, id, answersBatch, userRole);
			}

			const exam = await this.examRepository.getById(attempt.exam_id);
			const now = new Date();
			// BUG #2: Always compute elapsed from server time for timeout check
			const elapsedSeconds = Math.floor((now.getTime() - new Date(attempt.started_at).getTime()) / 1000);
			const finalTimeSpent = Math.min(timeSpentSecondsParam ?? elapsedSeconds, elapsedSeconds);

			// Check timeout using server-side elapsed (+ 60s buffer for network latency)
			const durationSeconds = (exam?.duration_minutes || 60) * 60;
			const finalStatus = elapsedSeconds > durationSeconds + 60 ? "time_out" : "submitted";

			// Server-side Auto Grading
			const examQuestions = await this.examQuestionRepository.getQuestionsByExamId(attempt.exam_id);
			const userAnswers = await this.userAnswerRepository.getByAttemptId(id);

			let correctCount = 0;
			for (const eq of examQuestions) {
				const allQuestionAnswers = await this.answerRepository.getByQuestionId(eq.question_id);
				const correctAnswer = allQuestionAnswers.find((a) => a.is_correct);
				const ua = userAnswers.find((u) => u.question_id === eq.question_id);

				if (ua && correctAnswer && ua.selected_answer_id === correctAnswer.id) {
					correctCount++;
					// Ensure is_correct flag in user_answers is accurate
					if (!ua.is_correct) {
						await this.userAnswerRepository.updateUserAnswer(ua.id, { is_correct: true });
					}
				} else if (ua && ua.is_correct) {
					await this.userAnswerRepository.updateUserAnswer(ua.id, { is_correct: false });
				}
			}

			const totalQuestions = examQuestions.length;
			const totalMarks = exam?.total_marks || 100;
			const calculatedScore = totalQuestions > 0
				? Math.round((correctCount / totalQuestions) * totalMarks * 100) / 100
				: 0;

			await this.attemptRepository.updateAttempt(id, {
				status: finalStatus,
				score: calculatedScore,
				submitted_at: now,
				time_spent_seconds: finalTimeSpent,
			});

			const updatedAttempt = await this.attemptRepository.getById(id);
			return ServiceResponse.success<UserExamAttempt>(
				finalStatus === "time_out" ? "Exam attempt timed out and auto-submitted" : "Exam attempt submitted successfully",
				updatedAttempt as UserExamAttempt,
			);
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

	// Get detailed result of an attempt with ownership check
	async getAttemptResult(id: string, userId?: string, userRole?: string): Promise<ServiceResponse<any | null>> {
		try {
			const attempt = await this.attemptRepository.getById(id);
			if (!attempt) {
				return ServiceResponse.failure("User Exam Attempt not found", null, StatusCodes.NOT_FOUND);
			}
			if (userId && attempt.user_id !== userId && userRole !== "admin") {
				return ServiceResponse.failure("Forbidden - You do not own this exam attempt", null, StatusCodes.FORBIDDEN);
			}
			if (attempt.status === "in_progress") {
				return ServiceResponse.failure(
					"Cannot view result for an in-progress attempt",
					null,
					StatusCodes.BAD_REQUEST,
				);
			}

			// BUG #5: Iterate over examQuestions (not just userAnswers) to include unanswered questions
			const userAnswers = await this.userAnswerRepository.getByAttemptId(id);
			const examQuestions = await this.examQuestionRepository.getQuestionsByExamId(attempt.exam_id);
			const exam = await this.examRepository.getById(attempt.exam_id);

			// Build detailed results from all exam questions
			const details = await Promise.all(
				examQuestions.map(async (eq) => {
					const question = await this.questionRepository.getById(eq.question_id);
					const allAnswers = await this.answerRepository.getByQuestionId(eq.question_id);
					const correctAnswer = allAnswers.find((a) => a.is_correct);
					const ua = userAnswers.find((u) => u.question_id === eq.question_id);
					const selectedAnswer = ua ? await this.answerRepository.getById(ua.selected_answer_id) : null;

					return {
						question,
						selected_answer: selectedAnswer || null,
						correct_answer: correctAnswer || null,
						is_correct: ua ? Boolean(ua.is_correct) : false,
					};
				}),
			);

			const correctCount = details.filter((d) => d.is_correct).length;
			const wrongCount = details.filter((d) => !d.is_correct).length;

			return ServiceResponse.success("Attempt result found", {
				attempt,
				total_questions: examQuestions.length,
				correct_count: correctCount,
				wrong_count: wrongCount,
				total_marks: exam?.total_marks ?? 10,
				pass_percentage: exam?.pass_percentage ?? 50,
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

