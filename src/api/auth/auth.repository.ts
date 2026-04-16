import type { User } from "@/api/user/user.model";
import db from "@/common/configs/database";
import { RefreshToken } from "./auth.model";

export class AuthRepository {
    async findAll(): Promise<User[]> {
        return await db("user").select("*");
    }
    async createRefreshToken(
        id: string,
        user_id: string,
        token: string,
        expired_at: Date,
    ): Promise<RefreshToken | null> {
        return await db("refresh_token").insert({ id, user_id, token, expired_at });
    }

    async checkValidRefreshToken(
        user_id: string,
        refresh_token: string,
    ): Promise<boolean> {
        const result = await db("refresh_token")
            .where({ user_id, token: refresh_token })
            .first();
        return !!result;
    }

    async getRefreshToken(refresh_token: string): Promise<RefreshToken | null> {
        const result = await db("refresh_token")
            .where({ token: refresh_token })
            .andWhere("expired_at", ">", db.fn.now())
            .andWhere({ is_banned: false })
            .first();
        return result;
    }

    async getUserByToken(refresh_token: string): Promise<User | null> {
        const user = await db("refresh_token")
            .where({ token: refresh_token })
            .first();
        return user;
    }

    async banAllTokenByUserId(user_id: string): Promise<number | null> {
        const result = await db("refresh_token")
            .where({ user_id })
            .update({ is_banned: false });
        return result;
    }
    async banToken(token: string): Promise<number> {
        const result = await db("refresh_token")
            .update({ is_banned: true })
            .where({ token });
        return result;
    }
}
