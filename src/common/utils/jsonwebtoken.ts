import jwt from "jsonwebtoken";
import { env } from "@/common/utils/envConfig";
const {
    JWT_ACCESS_TOKEN_SECRET,
    JWT_REFRESH_TOKEN_SECRET,
    JWT_ACCESS_TOKEN_TIME,
    JWT_REFRESH_TOKEN_TIME,
} = env;

export interface UserData {
    id: string;
    email: string;
    username: string;
}

// Access Token
export const createAccessToken = (information: UserData): string => {
    return jwt.sign(information, JWT_ACCESS_TOKEN_SECRET, {
        expiresIn: Number(JWT_ACCESS_TOKEN_TIME) * 60 * 60,
    });
};

export const verifyAccessToken = (accessToken: string): UserData => {
    const decoded = jwt.verify(accessToken, JWT_ACCESS_TOKEN_SECRET) as {
        id: string;
        email: string;
        username: string;
    };
    const result: UserData = {
        id: decoded.id,
        email: decoded.email,
        username: decoded.username,
    };

    return result;
};

// Refresh Token
export const createRefreshToken = (information: UserData): string => {
    return jwt.sign(information, JWT_REFRESH_TOKEN_SECRET, {
        expiresIn: Number(JWT_REFRESH_TOKEN_TIME) * 60 * 60,
    });
};

export const verifyRefreshToken = (refreshToken: string): UserData => {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_TOKEN_SECRET) as {
        id: string;
        email: string;
        username: string;
    };
    const result: UserData = {
        id: decoded.id,
        email: decoded.email,
        username: decoded.username,
    };

    return result;
};
