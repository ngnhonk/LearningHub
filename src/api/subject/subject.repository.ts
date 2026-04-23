import type { Subject } from "@/api/subject/subject.model";
import db from "@/common/configs/database";

export class SubjectRepository {
  async findAll(): Promise<Subject[]> {
    return await db("subjects").select("*");
  }

  async findById(id: string): Promise<Subject | null> {
    return await db("subjects").where({ id }).first();
  }

  async deleteById(id: string): Promise<number | null> {
    return await db("subjects").where({ id }).del();
  }

  async createSubject(
    id: string,
    name: string,
    description: string,
  ): Promise<Subject> {
    const newSubject = { id, name, description };
    await db("subjects").insert(newSubject);
    return newSubject;
  }

  async updateSubject(
    id: string,
    payload: Partial<Omit<Subject, "id">>
  ): Promise<number> {
    return await db("subjects").where({ id }).update(payload);
  }
}
