import { StatusCodes } from "http-status-codes";
import * as xlsx from "xlsx";
import db from "@/common/configs/database";
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
				return ServiceResponse.failure(
					"No Exams found",
					null,
					StatusCodes.NOT_FOUND,
				);
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
				return ServiceResponse.failure(
					"Exam not found",
					null,
					StatusCodes.NOT_FOUND,
				);
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
	async getBySubjectId(
		subjectId: string,
	): Promise<ServiceResponse<Exam[] | null>> {
		try {
			const result = await this.examRepository.getBySubjectId(subjectId);
			if (!result || result.length === 0) {
				return ServiceResponse.failure(
					"No exams found for this subject",
					null,
					StatusCodes.NOT_FOUND,
				);
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
				return ServiceResponse.failure(
					"Exam not found",
					null,
					StatusCodes.NOT_FOUND,
				);
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
			return ServiceResponse.success<number>(
				"Exam created successfully",
				newExam,
			);
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

	async updateExam(
		id: string,
		payload: Partial<Omit<Exam, "id" | "created_by" | "created_at">>,
	): Promise<ServiceResponse<Exam | null>> {
		try {
			const existingExam = await this.examRepository.getById(id);
			if (!existingExam) {
				return ServiceResponse.failure(
					"Exam not found",
					null,
					StatusCodes.NOT_FOUND,
				);
			}
			await this.examRepository.updateExam(id, payload);
			const updatedExam = await this.examRepository.getById(id);
			return ServiceResponse.success<Exam>(
				"Exam updated successfully",
				updatedExam as Exam,
			);
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
				return ServiceResponse.failure(
					"Exam not found",
					null,
					StatusCodes.NOT_FOUND,
				);
			}

			// Get all exam_questions for this exam
			const examQuestions =
				await this.examQuestionRepository.getQuestionsByExamId(id);

			// Build questions with answers
			const questions = await Promise.all(
				examQuestions.map(async (eq) => {
					const question = await this.questionRepository.getById(
						eq.question_id,
					);
					const answers = await this.answerRepository.getByQuestionId(
						eq.question_id,
					);

					// Hide is_correct from answers so students can't cheat
					const sanitizedAnswers = answers.map(
						({ is_correct, ...rest }) => rest,
					);

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

	// async importFromExcel(fileBuffer: Buffer, created_by: string, subject_id?: string): Promise<ServiceResponse<any | null>> {
	// 	try {
	// 		const workbook = xlsx.read(fileBuffer, { type: "buffer" });

	// 		const examSheet = workbook.Sheets["Exam"];
	// 		const questionSheet = workbook.Sheets["Questions"];

	// 		if (!examSheet || !questionSheet) {
	// 			return ServiceResponse.failure("File Excel must have 'Exam' and 'Questions' sheets", null, StatusCodes.BAD_REQUEST);
	// 		}

	// 		const examData: any[] = xlsx.utils.sheet_to_json(examSheet);
	// 		if (examData.length === 0) {
	// 			return ServiceResponse.failure("No exam data found in 'Exam' sheet", null, StatusCodes.BAD_REQUEST);
	// 		}

	// 		const examInfo = examData[0];
	// 		const questionsData: any[] = xlsx.utils.sheet_to_json(questionSheet);

	// 		if (questionsData.length === 0) {
	// 			return ServiceResponse.failure("No questions found in 'Questions' sheet", null, StatusCodes.BAD_REQUEST);
	// 		}

	// 		const finalSubjectId = subject_id || examInfo.SubjectId;
	// 		if (!finalSubjectId) {
	// 			return ServiceResponse.failure("subject_id is required either in Excel or in form data", null, StatusCodes.BAD_REQUEST);
	// 		}

	// 		// Validate and process inside a transaction
	// 		return await db.transaction(async (trx: any) => {
	// 			const examId = uuidv7();

	// 			// 1. Create Exam
	// 			await trx("exams").insert({
	// 				id: examId,
	// 				title: examInfo.Title || "Untitled Exam",
	// 				description: examInfo.Description || "",
	// 				subject_id: finalSubjectId,
	// 				duration_minutes: examInfo.Duration || 60,
	// 				total_marks: examInfo.TotalMarks || 100,
	// 				pass_percentage: examInfo.PassPercentage || 50,
	// 				is_published: examInfo.IsPublished || false,
	// 				created_by,
	// 			});

	// 			// 2. Create Questions and Answers
	// 			for (const qRow of questionsData) {
	// 				const questionId = uuidv7();

	// 				// Create Question
	// 				await trx("questions").insert({
	// 					id: questionId,
	// 					content: qRow.Content,
	// 					created_by,
	// 				});

	// 				// Create Answers (4 options)
	// 				const correctAnswerIndex = parseInt(qRow.Correct, 10);

	// 				const answers = [
	// 					{ content: qRow.Option1, is_correct: correctAnswerIndex === 1 },
	// 					{ content: qRow.Option2, is_correct: correctAnswerIndex === 2 },
	// 					{ content: qRow.Option3, is_correct: correctAnswerIndex === 3 },
	// 					{ content: qRow.Option4, is_correct: correctAnswerIndex === 4 },
	// 				];

	// 				for (const answer of answers) {
	// 					if (answer.content) { // Only create if option has content
	// 						await trx("answers").insert({
	// 							id: uuidv7(),
	// 							question_id: questionId,
	// 							content: String(answer.content),
	// 							is_correct: answer.is_correct,
	// 						});
	// 					}
	// 				}

	// 				// 3. Link Question to Exam
	// 				await trx("exam_questions").insert({
	// 					id: uuidv7(),
	// 					exam_id: examId,
	// 					question_id: questionId,
	// 				});
	// 			}

	// 			return ServiceResponse.success("Exam and questions imported successfully", { examId });
	// 		});

	// 	} catch (error) {
	// 		const errorMessage = `Error importing exam from Excel: ${(error as Error).message}`;
	// 		logger.error(errorMessage);
	// 		return ServiceResponse.failure(
	// 			"An error occurred while importing exam.",
	// 			null,
	// 			StatusCodes.INTERNAL_SERVER_ERROR,
	// 		);
	// 	}
	// }
	async importFromExcel(
		fileBuffer: Buffer,
		created_by: string,
		subject_id?: string,
	): Promise<ServiceResponse<any | null>> {
		try {
			const workbook = xlsx.read(fileBuffer, { type: "buffer" });

			const examSheet = workbook.Sheets["Exam"];
			const questionSheet = workbook.Sheets["Questions"];

			if (!examSheet || !questionSheet) {
				return ServiceResponse.failure(
					"File Excel must have 'Exam' and 'Questions' sheets",
					null,
					StatusCodes.BAD_REQUEST,
				);
			}

			const examData: any[] = xlsx.utils.sheet_to_json(examSheet);
			if (examData.length === 0) {
				return ServiceResponse.failure(
					"No exam data found in 'Exam' sheet",
					null,
					StatusCodes.BAD_REQUEST,
				);
			}

			const examInfo = examData[0];
			const questionsData: any[] = xlsx.utils.sheet_to_json(questionSheet);

			if (questionsData.length === 0) {
				return ServiceResponse.failure(
					"No questions found in 'Questions' sheet",
					null,
					StatusCodes.BAD_REQUEST,
				);
			}

			const finalSubjectId = subject_id || examInfo.SubjectId;
			if (!finalSubjectId) {
				return ServiceResponse.failure(
					"subject_id is required either in Excel or in form data",
					null,
					StatusCodes.BAD_REQUEST,
				);
			}

			const examInput = {
				title: examInfo.Title || "Untitled Exam",
				description: examInfo.Description || "",
				subject_id: finalSubjectId,
				duration_minutes: examInfo.Duration || 60,
				total_marks: examInfo.TotalMarks || 100,
				pass_percentage: examInfo.PassPercentage || 50,
				is_published: examInfo.IsPublished || false,
				created_by,
			};

			const questions = questionsData.map((qRow) => {
				const correctAnswerIndex = parseInt(qRow.Correct, 10);
				const rawAnswers = [
					{ content: qRow.Option1, is_correct: correctAnswerIndex === 1 },
					{ content: qRow.Option2, is_correct: correctAnswerIndex === 2 },
					{ content: qRow.Option3, is_correct: correctAnswerIndex === 3 },
					{ content: qRow.Option4, is_correct: correctAnswerIndex === 4 },
				];

				return {
					content: qRow.Content,
					answers: rawAnswers
						.filter((a) => a.content) // Only keep options with content
						.map((a) => ({
							content: String(a.content),
							is_correct: a.is_correct,
						})),
				};
			});

			const examId = await this.examRepository.importExamWithQuestions(
				examInput,
				questions,
			);

			return ServiceResponse.success(
				"Exam and questions imported successfully",
				{ examId },
			);
		} catch (error) {
			const errorMessage = `Error importing exam from Excel: ${(error as Error).message}`;
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
