import db from "@/common/configs/database";
import { Question } from "./question.model";

export class QuestionRepository {
  async getAll(): Promise<Question[]> {
    return await db("questions").select("*");
  }

  async getById(id: string): Promise<Question | null> {
    return await db("questions").where({ id }).first();
  }

  async deleteById(id: string): Promise<number | null> {
    return await db("questions").where({ id }).del();
  }

  async createQuestion(
    id: string,
    content: string,
    created_by: string,
  ): Promise<number> {
    const [result] = await db("questions").insert({ id, content, created_by });
    return result;
  }

  async updateQuestion(
    id: string,
    payload: Partial<Omit<Question, "id">>,
  ): Promise<number | null> {
    return await db("questions").where({ id }).update(payload);
  }
}
