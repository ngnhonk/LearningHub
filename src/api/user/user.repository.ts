import type { User } from "@/api/user/user.model";
import db from "@/common/configs/database";

export class UserRepository {
  async getAll(): Promise<User[]> {
    return await db("users").select("*");
  }

  async getById(id: string): Promise<User | null> {
    return await db("users").where({ id }).first();
  }

  async getByEmail(email: string): Promise<User | null> {
    return await db("users").where({ email }).first();
  }

  async getByUsername(username: string): Promise<User | null> {
    return await db("users").where({ username }).first();
  }

  async deleteById(id: string): Promise<number | null> {
    return await db("users").where({ id }).del();
  }

  async addAvatar(user_id: string, avatar_url: string): Promise<User> {
    return await db("users").where({ id: user_id }).update({ avatar_url });
  }

  async createUser(
    id: string,
    email: string,
    full_name: string,
    username: string,
    hashed_password: string,
  ): Promise<User> {
    const newUser = await db("users").insert({
      id,
      email,
      full_name,
      username,
      hashed_password,
    });
    return newUser;
  }
}
