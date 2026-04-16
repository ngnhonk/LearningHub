import { StatusCodes } from "http-status-codes";
import type { User } from "@/api/user/user.model";
import { UserRepository } from "@/api/user/user.repository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { AuthRepository } from "./auth.repository";
import { logger } from "@/server";
import { hashPassword, comparePassword } from "@/common/utils/hashPassword";
import { v7 as uuidv7 } from "uuid";
import * as jwt from "@/common/utils/jsonwebtoken";
import { Response } from "express";
import { env } from "@/common/utils/envConfig";
import { addHours } from "date-fns";
const { JWT_REFRESH_TOKEN_TIME, JWT_ACCESS_TOKEN_TIME } = env;

export class AuthService {
    private authRepository: AuthRepository;
    private userRepository: UserRepository;

    constructor(
        authRepository: AuthRepository = new AuthRepository(),
        userRepository: UserRepository = new UserRepository(),
    ) {
        this.authRepository = authRepository;
        this.userRepository = userRepository;
    }

    async login(
        identify: string,
        password: string,
        res: Response,
    ): Promise<ServiceResponse<object | string | null>> {
        try {
            const user =
                (await this.userRepository.findByEmail(identify)) ||
                (await this.userRepository.findByUsername(identify));

            if (!user) {
                return ServiceResponse.failure(
                    "Invalid credentials",
                    null,
                    StatusCodes.UNAUTHORIZED,
                );
            }

            const isMatch = await comparePassword(password, user.hashed_password);
            if (!isMatch) {
                return ServiceResponse.failure(
                    "Invalid credentials",
                    null,
                    StatusCodes.UNAUTHORIZED,
                );
            }

            const session_id = uuidv7();
            const { hashed_password, ...userRefined } = user;
            const refreshToken = jwt.createRefreshToken(userRefined);
            const expiredAt = addHours(new Date(), Number(JWT_REFRESH_TOKEN_TIME));
            await this.authRepository.createRefreshToken(
                session_id,
                userRefined.id,
                refreshToken,
                expiredAt,
            );

            const accessToken = jwt.createAccessToken(userRefined);
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: "strict",
                maxAge: Number(JWT_REFRESH_TOKEN_TIME) * 60 * 60 * 1000,
            });
            return ServiceResponse.success(
                "Logged in successfully!",
                {
                    accessToken: accessToken,
                },
                StatusCodes.OK,
            );
        } catch (ex) {
            const errorMessage = `Error logging ${identify}:, ${(ex as Error).message}`;
            logger.error(errorMessage);
            return ServiceResponse.failure(
                "An error occurred while logging in.",
                null,
                StatusCodes.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async register(
        email: string,
        username: string,
        password: string,
    ): Promise<ServiceResponse<User | null>> {
        try {
            const user =
                (await this.userRepository.findByEmail(email)) ||
                (await this.userRepository.findByUsername(username));

            if (user) {
                return ServiceResponse.failure(
                    "Email or username already in use",
                    null,
                    StatusCodes.CONFLICT,
                );
            }
            const hashed_password = await hashPassword(password);
            const id = uuidv7();
            const newUser = await this.userRepository.createUser(
                id,
                email,
                username,
                hashed_password,
            );

            return ServiceResponse.success<User>("Registration successful", newUser);
        } catch (ex) {
            const errorMessage = `Error registering user ${username}:, ${(ex as Error).message}`;
            logger.error(errorMessage);
            return ServiceResponse.failure(
                "An error occurred while registering.",
                null,
                StatusCodes.INTERNAL_SERVER_ERROR,
            );
        }
    }

    // Retrieves all users from the database
    async findAll(): Promise<ServiceResponse<User[] | null>> {
        try {
            const users = await this.authRepository.findAll();
            if (!users || users.length === 0) {
                return ServiceResponse.failure(
                    "No Users found",
                    null,
                    StatusCodes.NOT_FOUND,
                );
            }
            return ServiceResponse.success<User[]>("Users found", users);
        } catch (ex) {
            const errorMessage = `Error finding all users: $${(ex as Error).message}`;
            logger.error(errorMessage);
            return ServiceResponse.failure(
                "An error occurred while retrieving users.",
                null,
                StatusCodes.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async createAccessToken(
        refreshToken: string,
        res: Response,
    ): Promise<ServiceResponse<string | null>> {
        try {
            // 1. verify JWT
            let payload;
            try {
                payload = jwt.verifyRefreshToken(refreshToken);
            } catch {
                return ServiceResponse.failure(
                    "Invalid token!",
                    null,
                    StatusCodes.UNAUTHORIZED,
                );
            }

            // 2. check DB
            const tokens = await this.authRepository.getRefreshToken(refreshToken);

            if (!tokens) {
                return ServiceResponse.failure(
                    "Invalid Refresh Token",
                    null,
                    StatusCodes.UNAUTHORIZED,
                );
            }

            const tokenRecord = tokens;

            // 3. detect reuse
            if (tokenRecord.is_banned) {
                await this.authRepository.banAllTokenByUserId(payload.id);

                return ServiceResponse.failure(
                    "Token reuse detected. Please login again.",
                    null,
                    StatusCodes.UNAUTHORIZED,
                );
            }

            // 4. create access token
            const accessToken = jwt.createAccessToken(payload);

            // 5. rotate refresh token
            const newRefreshToken = jwt.createRefreshToken(payload);

            const expiredAt = addHours(new Date(), Number(JWT_REFRESH_TOKEN_TIME));
            const sessionId = uuidv7();

            await this.authRepository.banToken(refreshToken);

            await this.authRepository.createRefreshToken(
                sessionId,
                payload.id,
                newRefreshToken,
                expiredAt,
            );

            // 6. set cookie
            res.cookie("refreshToken", newRefreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: "strict",
                maxAge: Number(JWT_REFRESH_TOKEN_TIME) * 60 * 60 * 1000,
            });

            return ServiceResponse.success(
                "Created access token successfully!",
                accessToken,
                StatusCodes.CREATED,
            );
        } catch (error) {
            logger.error(`Error creating access token: ${(error as Error).message}`);

            return ServiceResponse.failure(
                "An error occurred while sending request.",
                null,
                StatusCodes.INTERNAL_SERVER_ERROR,
            );
        }
    }

    // Logout
    async logout(
        refresh_token: string,
        res: Response,
    ): Promise<ServiceResponse<number | string | null>> {
        try {
            if (refresh_token === undefined) {
                return ServiceResponse.failure(
                    "You must login before logout!",
                    null,
                    StatusCodes.BAD_REQUEST,
                );
            }
            await this.authRepository.banToken(refresh_token);
            res.clearCookie("refreshToken", {
                httpOnly: true,
                secure: false,
                sameSite: "strict",
            });
            return ServiceResponse.success("Logged out!", null, StatusCodes.OK);
        } catch (error) {
            const errorMessage = `Error when logging out: ${(error as Error).message
                }`;
            logger.error(errorMessage);
            return ServiceResponse.failure(
                "An error occurred while logging out.",
                errorMessage,
                StatusCodes.INTERNAL_SERVER_ERROR,
            );
        }
    }
}

export const authService = new AuthService();
