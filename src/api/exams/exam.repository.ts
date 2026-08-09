import db from "@/common/configs/database";
import type { Exam } from "./exam.model";
import { v7 as uuidv7 } from "uuid";

interface ImportQuestionInput {
	content: string;
	answers: { content: string; is_correct: boolean }[];
}

interface ImportExamInput {
	title: string;
	description: string;
	subject_id: string;
	duration_minutes: number;
	total_marks: number;
	pass_percentage: number;
	is_published: boolean;
	created_by: string;
}

export class ExamRepository {
	async getAll(): Promise<Exam[]> {
		return await db("exams")
			.select("exams.*")
			.count("exam_questions.question_id as question_count")
			.leftJoin("exam_questions", "exams.id", "exam_questions.exam_id")
			.groupBy("exams.id");
	}

	async getById(id: string): Promise<Exam | null> {
		return await db("exams")
			.where({ "exams.id": id })
			.select("exams.*")
			.count("exam_questions.question_id as question_count")
			.leftJoin("exam_questions", "exams.id", "exam_questions.exam_id")
			.groupBy("exams.id")
			.first();
	}

	async getBySubjectId(subjectId: string): Promise<Exam[]> {
		return await db("exams")
			.where({ subject_id: subjectId })
			.select("exams.*")
			.count("exam_questions.question_id as question_count")
			.leftJoin("exam_questions", "exams.id", "exam_questions.exam_id")
			.groupBy("exams.id");
	}

	async deleteById(id: string): Promise<number | null> {
		return await db("exams").where({ id }).del();
	}

	async createExam(data: Omit<Exam, "created_at">): Promise<number> {
		const [result] = await db("exams").insert(data);
		return result;
	}

	async updateExam(
		id: string,
		payload: Partial<Omit<Exam, "id" | "created_by" | "created_at">>,
	): Promise<number | null> {
		return await db("exams").where({ id }).update(payload);
	}
	async importExamWithQuestions(
		examInput: ImportExamInput,
		questions: ImportQuestionInput[],
	): Promise<string> {
		return await db.transaction(async (trx: any) => {
			const examId = uuidv7();

			// 1. Create Exam
			await trx("exams").insert({
				id: examId,
				...examInput,
			});

			// 2. Create Questions and Answers
			for (const q of questions) {
				const questionId = uuidv7();

				await trx("questions").insert({
					id: questionId,
					content: q.content,
					created_by: examInput.created_by,
				});

				for (const answer of q.answers) {
					await trx("answers").insert({
						id: uuidv7(),
						question_id: questionId,
						content: answer.content,
						is_correct: answer.is_correct,
					});
				}

				// 3. Link Question to Exam
				await trx("exam_questions").insert({
					id: uuidv7(),
					exam_id: examId,
					question_id: questionId,
				});
			}

			return examId;
		});
	}
}
