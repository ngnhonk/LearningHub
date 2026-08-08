import db from "@/common/configs/database";
import type { UserAnswer } from "./user_answer.model";

export class UserAnswerRepository {
	async getAll(): Promise<UserAnswer[]> {
		return await db("user_answers").select("*");
	}

	async getById(id: string): Promise<UserAnswer | null> {
		return await db("user_answers").where({ id }).first();
	}

	async getByAttemptId(attempId: string): Promise<UserAnswer[]> {
		return await db("user_answers").where({ attemp_id: attempId }).select("*");
	}

	async getByAttemptAndQuestion(attempId: string, questionId: string): Promise<UserAnswer | null> {
		return await db("user_answers")
			.where({ attemp_id: attempId, question_id: questionId })
			.first();
	}

	async createUserAnswer(data: UserAnswer): Promise<number> {
		const [result] = await db("user_answers").insert(data);
		return result;
	}

	async updateUserAnswer(id: string, payload: Partial<Omit<UserAnswer, "id">>): Promise<number | null> {
		return await db("user_answers").where({ id }).update(payload);
	}

	async upsertUserAnswer(data: UserAnswer): Promise<UserAnswer> {
		const existing = await this.getByAttemptAndQuestion(data.attemp_id, data.question_id);
		if (existing) {
			await db("user_answers").where({ id: existing.id }).update({
				selected_answer_id: data.selected_answer_id,
				is_correct: data.is_correct,
				answered_at: data.answered_at,
			});
			return { ...existing, selected_answer_id: data.selected_answer_id, is_correct: data.is_correct, answered_at: data.answered_at };
		} else {
			await db("user_answers").insert(data);
			return data;
		}
	}

	async deleteById(id: string): Promise<number | null> {
		return await db("user_answers").where({ id }).del();
	}

	async deleteByAttemptId(attempId: string): Promise<number | null> {
		return await db("user_answers").where({ attemp_id: attempId }).del();
	}
}

