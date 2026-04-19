import type { User } from "@/api/user/user.model";
import db from "@/common/configs/database";

export class UserRepository {
  async findAll(): Promise<User[]> {
    return await db("user").select("*");
  }

  async findById(id: string): Promise<User | null> {
    return await db("user").where({ id }).first();
  }

  async findByEmail(email: string): Promise<User | null> {
    return await db("user").where({ email }).first();
  }

  async findByUsername(username: string): Promise<User | null> {
    return await db("user").where({ username }).first();
  }

  async deleteById(id: string): Promise<number | null> {
    return await db("user").where({ id }).del();
  }
  async createUser(
    id: string,
    email: string,
    username: string,
    hashed_password: string,
  ): Promise<User> {
    const newUser = await db("user").insert({
      id,
      email,
      username,
      hashed_password,
    });
    return newUser;
  }
}
