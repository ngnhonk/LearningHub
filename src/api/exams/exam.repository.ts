import db from "@/common/configs/database";
import type { Exam } from "./exam.model";

export class ExamRepository {
	async getAll(): Promise<Exam[]> {
		return await db("exams").select("*");
	}

	async getById(id: string): Promise<Exam | null> {
		return await db("exams").where({ id }).first();
	}

	async deleteById(id: string): Promise<number | null> {
		return await db("exams").where({ id }).del();
	}

	async createExam(data: Omit<Exam, "created_at">): Promise<number> {
		const [result] = await db("exams").insert(data);
		return result;
	}

	async updateExam(id: string, payload: Partial<Omit<Exam, "id" | "created_by" | "created_at">>): Promise<number | null> {
		return await db("exams").where({ id }).update(payload);
	}
}
