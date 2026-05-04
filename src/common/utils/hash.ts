import bcrypt from "bcrypt";
import crypto from "crypto";
import { env } from "@/common/utils/envConfig";

const { SALT_ROUNDS, TOKEN_HASH_SECRET } = env;

export async function hash(plain: string): Promise<string> {
	return await bcrypt.hash(plain, Number(SALT_ROUNDS));
}

export async function compare(plain: string, hash: string): Promise<boolean> {
	return await bcrypt.compare(plain, hash);
}

export function hashToken(token: string) {
	return crypto
		.createHash("sha256")
		.update(token + TOKEN_HASH_SECRET)
		.digest("hex");
}
