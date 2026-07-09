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

	async deleteById(id: string): Promise<number | null> {
		return await db("user_answers").where({ id }).del();
	}

	async deleteByAttemptId(attempId: string): Promise<number | null> {
		return await db("user_answers").where({ attemp_id: attempId }).del();
	}
}
