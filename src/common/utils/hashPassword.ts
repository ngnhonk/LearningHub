import bcrypt from "bcrypt";

const saltRounds = 10;

export async function hashPassword(plain: string): Promise<string> {
    return await bcrypt.hash(plain, saltRounds);
}

export async function comparePassword(
    plain: string,
    hash: string,
): Promise<boolean> {
    return await bcrypt.compare(plain, hash);
}
