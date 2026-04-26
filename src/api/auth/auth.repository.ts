import type { User } from "@/api/user/user.model";
import db from "@/common/configs/database";
import type { RefreshToken } from "./auth.model";

export class AuthRepository {
	async findAll(): Promise<User[]> {
		return await db("users").select("*");
	}
	async createHashedToken(
		id: string,
		user_id: string,
		hashed_token: string,
		expires_at: Date,
	): Promise<RefreshToken | null> {
		return await db("refresh_tokens").insert({
			id,
			user_id,
			hashed_token,
			expires_at,
		});
	}

	async checkValidHashedToken(user_id: string, hashed_token: string): Promise<boolean> {
		const result = await db("refresh_tokens").where({ user_id, hashed_token }).first();
		return !!result;
	}

	async getHashedToken(hashed_token: string): Promise<RefreshToken | null> {
		const result = await db("refresh_tokens")
			.where({ hashed_token })
			.andWhere("expires_at", ">", db.fn.now())
			.andWhere({ revoked: false })
			.first();
		return result;
	}

	async getUserByToken(hashed_token: string): Promise<User | null> {
		const user = await db("refresh_tokens").where({ hashed_token }).first();
		return user;
	}

	async banAllTokenByUserId(user_id: string): Promise<number | null> {
		const result = await db("refresh_tokens").where({ user_id }).update({ revoked: true });
		return result;
	}
	async banToken(hashed_token: string): Promise<number> {
		const result = await db("refresh_tokens").update({ revoked: true }).where({ hashed_token });
		return result;
	}
}
