import db from "@/common/configs/database";
import type { ExamQuestion } from "./exam_question.model";

export class ExamQuestionRepository {
	async getAll(): Promise<ExamQuestion[]> {
		return await db("exam_questions").select("*");
	}

	async getById(id: string): Promise<ExamQuestion | null> {
		return await db("exam_questions").where({ id }).first();
	}

	async deleteById(id: string): Promise<number | null> {
		return await db("exam_questions").where({ id }).del();
	}

	async createExamQuestion(id: string, exam_id: string, question_id: string): Promise<number> {
		const [result] = await db("exam_questions").insert({ id, exam_id, question_id });
		return result;
	}

	async updateExamQuestion(id: string, payload: Partial<Omit<ExamQuestion, "id">>): Promise<number | null> {
		return await db("exam_questions").where({ id }).update(payload);
	}
}
