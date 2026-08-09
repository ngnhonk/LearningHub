import { StatusCodes } from "http-status-codes";
import type { Response } from "express";
import type { User } from "@/api/user/user.model";
import { UserRepository } from "@/api/user/user.repository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import { compare, hash, hashToken } from "@/common/utils/hash";
import { AuthRepository } from "../auth/auth.repository";
import { AuthenticatedRequest } from "@/common/middleware/authenticate";

export class UserService {
  private userRepository: UserRepository;
  private authRepository: AuthRepository;

  constructor(
    repository: UserRepository = new UserRepository(),
    authRepository: AuthRepository = new AuthRepository(),
  ) {
    this.userRepository = repository;
    this.authRepository = authRepository;
  }

  // Retrieves all users from the database
  async getAll(): Promise<ServiceResponse<User[] | null>> {
    try {
      const users = await this.userRepository.getAll();
      if (!users || users.length === 0) {
        return ServiceResponse.failure(
          "No Users found",
          null,
          StatusCodes.NOT_FOUND,
        );
      }
      return ServiceResponse.success<User[]>("Users found", users);
    } catch (error) {
      const errorMessage = `Error finding all users: $${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving users.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Retrieves a single user by their ID
  async getById(id: string): Promise<ServiceResponse<User | null>> {
    try {
      const user = await this.userRepository.getById(id);
      if (!user) {
        return ServiceResponse.failure(
          "User not found",
          null,
          StatusCodes.NOT_FOUND,
        );
      }
      return ServiceResponse.success<User>("User found", user);
    } catch (error) {
      const errorMessage = `Error finding user with id ${id}:, ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while finding user.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Retrieves personal profile of the logged-in user
  async getProfile(userId: string): Promise<ServiceResponse<any | null>> {
    try {
      const user = await this.userRepository.getById(userId);
      if (!user) {
        return ServiceResponse.failure(
          "User not found",
          null,
          StatusCodes.NOT_FOUND,
        );
      }
      const rawUser = user as any;
      const { hashed_password, create_at, created_at, ...rest } = rawUser;
      const profile = {
        ...rest,
        created_at: created_at || create_at || null,
      };
      return ServiceResponse.success("User profile retrieved successfully", profile);
    } catch (error) {
      const errorMessage = `Error retrieving profile for user ${userId}: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving user profile.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }



  async deleteById(id: string): Promise<ServiceResponse<number | null>> {
    try {
      const user = await this.userRepository.deleteById(id);
      if (!user) {
        return ServiceResponse.failure(
          "User not found",
          null,
          StatusCodes.NOT_FOUND,
        );
      }
      return ServiceResponse.success<number>("User deleted", user);
    } catch (error) {
      const errorMessage = `Error finding user with id ${id}:, ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while deleting an user.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async changePassword(
    req: AuthenticatedRequest,
    oldPassword: string,
    newPassword: string,
    res: Response,
  ): Promise<ServiceResponse<number | string | null>> {
    // 1. get user by id
    const id = (req as any).user.id;

    const user = await this.userRepository.getById(id);
    if (!user) {
      return ServiceResponse.failure(
        "Invalid user",
        null,
        StatusCodes.BAD_REQUEST,
      );
    }

    // 2. check old password
    const isMatch = await compare(oldPassword, user.hashed_password);
    if (!isMatch) {
      return ServiceResponse.failure(
        "Invalid password",
        null,
        StatusCodes.CONFLICT,
      );
    }

    // 3. update password
    const new_hashed_password = await hash(newPassword);
    const result = await this.userRepository.changePassword(
      id,
      new_hashed_password,
    );

    // 4. revoke refresh token by user_id
    await this.authRepository.banAllTokenByUserId(user.id);

    // 5. delete refresh_token in cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    return ServiceResponse.success<null>("Password changed successfully", null);
  }

  async changeAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<ServiceResponse<User | null>> {
    try {
      if (!file) {
        return ServiceResponse.failure(
          "No avatar image file uploaded or invalid file format",
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      const user = await this.userRepository.getById(userId);
      if (!user) {
        return ServiceResponse.failure(
          "User not found",
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      const avatarUrl = `/uploads/avatars/${file.filename}`;
      const updatedUser = await this.userRepository.addAvatar(
        userId,
        avatarUrl,
      );

      return ServiceResponse.success<User>(
        "Avatar updated successfully",
        updatedUser,
      );
    } catch (error) {
      const errorMessage = `Error changing avatar for user ${userId || "unknown"}: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while changing avatar.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async changeUserRole(
    id: string,
    newRole: string,
  ): Promise<ServiceResponse<User | null>> {
    try {
      const user = await this.userRepository.getById(id);
      if (!user) {
        return ServiceResponse.failure(
          "User not found",
          null,
          StatusCodes.NOT_FOUND,
        );
      }
      await this.userRepository.changeUserRole(id, newRole);
      return ServiceResponse.success<null>(
        "User role changed successfully",
        null,
      );
    } catch (error) {
      const errorMessage = `Error changing user role for user ${id || "unknown"}: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while changing user role.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const userService = new UserService();
