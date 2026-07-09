import { StatusCodes } from "http-status-codes";
import { v7 as uuidv7 } from "uuid";
import * as xlsx from "xlsx";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import type { Exam } from "./exam.model";
import { ExamRepository } from "./exam.repository";
import { ExamQuestionRepository } from "@/api/exam_questions/exam_question.repository";
import { QuestionRepository } from "@/api/questions/question.repository";
import { AnswerRepository } from "@/api/answers/answer.repository";
import db from "@/common/configs/database";

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

	async importExam(
		subjectId: string,
		createdBy: string,
		fileBuffer: Buffer,
	): Promise<ServiceResponse<any | null>> {
		const trx = await db.transaction();
		try {
			const workbook = xlsx.read(fileBuffer, { type: "buffer" });

			// Read Exam sheet
			const examSheetName = workbook.SheetNames.find((name) => name.toLowerCase() === "exam");
			if (!examSheetName) {
				await trx.rollback();
				return ServiceResponse.failure("Excel file missing 'Exam' sheet", null, StatusCodes.BAD_REQUEST);
			}
			const examDataList: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[examSheetName]);
			if (examDataList.length === 0) {
				await trx.rollback();
				return ServiceResponse.failure("'Exam' sheet has no data", null, StatusCodes.BAD_REQUEST);
			}

			const examData = examDataList[0];
			const title = examData.Title || examData.title;
			const description = examData.Description || examData.description || "";
			const duration_minutes = Number(examData.DurationMinutes || examData.duration_minutes || 60);
			const total_marks = Number(examData.TotalMarks || examData.total_marks || 100);
			const pass_percentage = Number(examData.PassPercentage || examData.pass_percentage || 50);
			const is_published = examData.IsPublished !== undefined ? Boolean(examData.IsPublished) : true;

			if (!title) {
				await trx.rollback();
				return ServiceResponse.failure("Exam Title is required in excel sheet", null, StatusCodes.BAD_REQUEST);
			}

			// Read Questions sheet
			const questionsSheetName = workbook.SheetNames.find((name) => name.toLowerCase() === "questions");
			if (!questionsSheetName) {
				await trx.rollback();
				return ServiceResponse.failure("Excel file missing 'Questions' sheet", null, StatusCodes.BAD_REQUEST);
			}
			const questionsDataList: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[questionsSheetName]);
			if (questionsDataList.length === 0) {
				await trx.rollback();
				return ServiceResponse.failure("'Questions' sheet has no data", null, StatusCodes.BAD_REQUEST);
			}

			// Insert Exam
			const examId = uuidv7();
			await trx("exams").insert({
				id: examId,
				title,
				description,
				subject_id: subjectId,
				duration_minutes,
				total_marks,
				pass_percentage,
				is_published: is_published ? 1 : 0,
				created_by: createdBy,
				created_at: new Date(),
			});

			let questionCount = 0;
			for (const qRow of questionsDataList) {
				const questionContent = qRow.QuestionContent || qRow.question_content || qRow.Content || qRow.content;
				if (!questionContent) {
					continue; // Skip empty question content row
				}

				const questionId = uuidv7();
				// Insert Question
				await trx("questions").insert({
					id: questionId,
					content: questionContent,
					created_by: createdBy,
					created_at: new Date(),
				});

				// Link Exam & Question
				const examQuestionId = uuidv7();
				await trx("exam_questions").insert({
					id: examQuestionId,
					exam_id: examId,
					question_id: questionId,
				});

				// Insert Answers (Options)
				const options = [
					qRow.Option1 || qRow.option_1 || qRow.A || qRow.a,
					qRow.Option2 || qRow.option_2 || qRow.B || qRow.b,
					qRow.Option3 || qRow.option_3 || qRow.C || qRow.c,
					qRow.Option4 || qRow.option_4 || qRow.D || qRow.d,
				].filter(Boolean);

				const correctOptionStr = String(qRow.CorrectOption || qRow.correct_option || qRow.Correct || qRow.correct || "");
				let correctIndex = -1;

				if (correctOptionStr) {
					const num = Number.parseInt(correctOptionStr, 10);
					if (!Number.isNaN(num) && num >= 1 && num <= 4) {
						correctIndex = num - 1;
					} else {
						const upper = correctOptionStr.trim().toUpperCase();
						if (upper === "A") correctIndex = 0;
						else if (upper === "B") correctIndex = 1;
						else if (upper === "C") correctIndex = 2;
						else if (upper === "D") correctIndex = 3;
					}
				}

				for (let i = 0; i < options.length; i++) {
					const answerId = uuidv7();
					const isCorrect = i === correctIndex;
					await trx("answers").insert({
						id: answerId,
						question_id: questionId,
						content: options[i],
						is_correct: isCorrect ? 1 : 0,
					});
				}

				questionCount++;
			}

			if (questionCount === 0) {
				await trx.rollback();
				return ServiceResponse.failure("No valid questions found to import", null, StatusCodes.BAD_REQUEST);
			}

			await trx.commit();

			return ServiceResponse.success("Exam and questions imported successfully", {
				exam_id: examId,
				title,
				question_count: questionCount,
			});
		} catch (error) {
			await trx.rollback();
			const errorMessage = `Error importing exam from excel: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while importing exam.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}
}

export const examService = new ExamService();
