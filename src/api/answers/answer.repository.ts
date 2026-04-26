import type { Answer } from "@/api/answers/answer.model";
import db from "@/common/configs/database";

export class AnswerRepository {
	async getAll(): Promise<Answer[]> {
		return await db("answers").select("*");
	}

	async getById(id: string): Promise<Answer | null> {
		return await db("answers").where({ id }).first();
	}

	async deleteById(id: string): Promise<number | null> {
		return await db("answers").where({ id }).del();
	}

	async createAnswer(id: string, question_id: string, content: string, is_correct: boolean): Promise<Answer> {
		const newAnswer = { id, question_id, content, is_correct };
		await db("answers").insert(newAnswer);
		return newAnswer;
	}

	async updateAnswer(id: string, payload: Partial<Omit<Answer, "id">>): Promise<number> {
		return await db("answers").where({ id }).update(payload);
	}
}
