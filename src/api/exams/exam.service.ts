import { StatusCodes } from "http-status-codes";
import { v7 as uuidv7 } from "uuid";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import type { Exam } from "./exam.model";
import { ExamRepository } from "./exam.repository";
import { ExamQuestionRepository } from "@/api/exam_questions/exam_question.repository";
import { QuestionRepository } from "@/api/questions/question.repository";
import { AnswerRepository } from "@/api/answers/answer.repository";

export class ExamService {
	private examRepository: ExamRepository;
	private examQuestionRepository: ExamQuestionRepository;
	private questionRepository: QuestionRepository;
	private answerRepository: AnswerRepository;

	constructor(
		repository: ExamRepository = new ExamRepository(),
		examQuestionRepository: ExamQuestionRepository = new ExamQuestionRepository(),
		questionRepository: QuestionRepository = new QuestionRepository(),
		answerRepository: AnswerRepository = new AnswerRepository(),
	) {
		this.examRepository = repository;
		this.examQuestionRepository = examQuestionRepository;
		this.questionRepository = questionRepository;
		this.answerRepository = answerRepository;
	}

	// Retrieves all exams from the database
	async getAll(): Promise<ServiceResponse<Exam[] | null>> {
		try {
			const result = await this.examRepository.getAll();
			if (!result || result.length === 0) {
				return ServiceResponse.failure("No Exams found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<Exam[]>("Exams found", result);
		} catch (error) {
			const errorMessage = `Error finding all exams: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while retrieving exams.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	// Retrieves a single exam by its ID
	async getById(id: string): Promise<ServiceResponse<Exam | null>> {
		try {
			const result = await this.examRepository.getById(id);
			if (!result) {
				return ServiceResponse.failure("Exam not found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<Exam>("Exam found", result);
		} catch (error) {
			const errorMessage = `Error finding exam with id ${id}: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while finding exam.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	// Retrieves all exams by subject ID
	async getBySubjectId(subjectId: string): Promise<ServiceResponse<Exam[] | null>> {
		try {
			const result = await this.examRepository.getBySubjectId(subjectId);
			if (!result || result.length === 0) {
				return ServiceResponse.failure("No exams found for this subject", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<Exam[]>("Exams found", result);
		} catch (error) {
			const errorMessage = `Error finding exams for subject ${subjectId}: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while retrieving exams.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async deleteById(id: string): Promise<ServiceResponse<number | null>> {
		try {
			const result = await this.examRepository.deleteById(id);
			if (!result) {
				return ServiceResponse.failure("Exam not found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<number>("Exam deleted", result);
		} catch (error) {
			const errorMessage = `Error deleting exam with id ${id}: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while deleting an exam.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async createExam(
		title: string,
		description: string,
		subject_id: string,
		duration_minutes: number,
		total_marks: number,
		pass_percentage: number,
		is_published: boolean,
		created_by: string,
	): Promise<ServiceResponse<number | null>> {
		try {
			const id = uuidv7();
			const newExam = await this.examRepository.createExam({
				id,
				title,
				description,
				subject_id,
				duration_minutes,
				total_marks,
				pass_percentage,
				is_published,
				created_by,
			});
			return ServiceResponse.success<number>("Exam created successfully", newExam);
		} catch (error) {
			const errorMessage = `Error creating exam: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while creating an exam.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async updateExam(id: string, payload: Partial<Omit<Exam, "id" | "created_by" | "created_at">>): Promise<ServiceResponse<Exam | null>> {
		try {
			const existingExam = await this.examRepository.getById(id);
			if (!existingExam) {
				return ServiceResponse.failure("Exam not found", null, StatusCodes.NOT_FOUND);
			}
			await this.examRepository.updateExam(id, payload);
			const updatedExam = await this.examRepository.getById(id);
			return ServiceResponse.success<Exam>("Exam updated successfully", updatedExam as Exam);
		} catch (error) {
			const errorMessage = `Error updating exam with id ${id}: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while updating an exam.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	// Get exam detail with questions and answers (hides is_correct)
	async getExamDetail(id: string): Promise<ServiceResponse<any | null>> {
		try {
			const exam = await this.examRepository.getById(id);
			if (!exam) {
				return ServiceResponse.failure("Exam not found", null, StatusCodes.NOT_FOUND);
			}

			// Get all exam_questions for this exam
			const examQuestions = await this.examQuestionRepository.getQuestionsByExamId(id);

			// Build questions with answers
			const questions = await Promise.all(
				examQuestions.map(async (eq) => {
					const question = await this.questionRepository.getById(eq.question_id);
					const answers = await this.answerRepository.getByQuestionId(eq.question_id);

					// Hide is_correct from answers so students can't cheat
					const sanitizedAnswers = answers.map(({ is_correct, ...rest }) => rest);

					return {
						...question,
						answers: sanitizedAnswers,
					};
				}),
			);

			return ServiceResponse.success("Exam detail found", {
				exam,
				questions,
			});
		} catch (error) {
			const errorMessage = `Error getting exam detail for id ${id}: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while retrieving exam detail.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}
}

export const examService = new ExamService();
