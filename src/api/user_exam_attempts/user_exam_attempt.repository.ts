import db from "@/common/configs/database";
import type { UserExamAttempt } from "./user_exam_attempt.model";

export class UserExamAttemptRepository {
	async getAll(): Promise<UserExamAttempt[]> {
		return await db("user_exam_attempts").select("*");
	}

	async getById(id: string): Promise<UserExamAttempt | null> {
		return await db("user_exam_attempts").where({ id }).first();
	}

	async getByUserId(userId: string): Promise<UserExamAttempt[]> {
		return await db("user_exam_attempts").where({ user_id: userId }).select("*");
	}

	async getByExamId(examId: string): Promise<UserExamAttempt[]> {
		return await db("user_exam_attempts").where({ exam_id: examId }).select("*");
	}

	async getInProgressByUserAndExam(userId: string, examId: string): Promise<UserExamAttempt | null> {
		return await db("user_exam_attempts")
			.where({ user_id: userId, exam_id: examId, status: "in_progress" })
			.first();
	}

	async createAttempt(data: Omit<UserExamAttempt, "submitted_at">): Promise<number> {
		const [result] = await db("user_exam_attempts").insert(data);
		return result;
	}

	async updateAttempt(id: string, payload: Partial<UserExamAttempt>): Promise<number | null> {
		return await db("user_exam_attempts").where({ id }).update(payload);
	}

	async deleteById(id: string): Promise<number | null> {
		return await db("user_exam_attempts").where({ id }).del();
	}
}
