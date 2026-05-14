import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import request from "supertest";

import type { ServiceResponse } from "@/common/models/serviceResponse";
import { env } from "@/common/utils/envConfig";
import { app } from "@/server";
import type { User } from "../user.model";
import { users } from "../user.repository";

// Generate a valid admin JWT token for authenticated routes
const adminToken = jwt.sign(
    {
        id: "019db44e-4581-70ca-978f-bebf6e23fb57",
        username: "admin",
        email: "admin@example.com",
        role: "admin",
    },
    env.JWT_ACCESS_TOKEN_SECRET,
    { expiresIn: "1h" },
);

describe("User API Endpoints", () => {
    describe("GET /users", () => {
        it("should return a list of users", async () => {
            // Act
            const response = await request(app)
                .get("/users")
                .set("Authorization", `Bearer ${adminToken}`);
            const responseBody: ServiceResponse<User[]> = response.body;

            // Assert
            expect(response.statusCode).toEqual(StatusCodes.OK);
            expect(responseBody.success).toBeTruthy();
            expect(responseBody.message).toContain("Users found");
            expect(responseBody.responseObject.length).toEqual(users.length);
            responseBody.responseObject.forEach((user, index) => compareUsers(users[index] as User, user));
        });

        it("should return 401 without authentication", async () => {
            // Act
            const response = await request(app).get("/users");

            // Assert
            expect(response.statusCode).toEqual(StatusCodes.UNAUTHORIZED);
        });
    });

    describe("GET /users/:id", () => {
        it("should return a user for a valid ID", async () => {
            // Arrange
            const testId = "019db44e-4581-70ca-978f-bebf6e23fb57";
            const expectedUser = users.find((user) => user.id === testId) as User;

            // Act
            const response = await request(app).get(`/users/${testId}`);
            const responseBody: ServiceResponse<User> = response.body;

            // Assert
            expect(response.statusCode).toEqual(StatusCodes.OK);
            expect(responseBody.success).toBeTruthy();
            expect(responseBody.message).toContain("User found");
            if (!expectedUser) throw new Error("Invalid test data: expectedUser is undefined");
            compareUsers(expectedUser, responseBody.responseObject);
        });

        it("should return a not found error for non-existent ID", async () => {
            // Arrange
            const testId = "00000000-0000-0000-0000-000000000000";

            // Act
            const response = await request(app).get(`/users/${testId}`);
            const responseBody: ServiceResponse = response.body;

            // Assert
            expect(response.statusCode).toEqual(StatusCodes.NOT_FOUND);
            expect(responseBody.success).toBeFalsy();
            expect(responseBody.message).toContain("User not found");
            expect(responseBody.responseObject).toBeNull();
        });

        it("should return a bad request for invalid ID format", async () => {
            // Act
            const invalidInput = "abc";
            const response = await request(app).get(`/users/${invalidInput}`);
            const responseBody: ServiceResponse = response.body;

            // Assert
            expect(response.statusCode).toEqual(StatusCodes.BAD_REQUEST);
            expect(responseBody.success).toBeFalsy();
            expect(responseBody.message).toContain("Invalid input");
            expect(responseBody.responseObject).toBeNull();
        });
    });
});

function compareUsers(mockUser: User, responseUser: Record<string, unknown>) {
    if (!mockUser || !responseUser) {
        throw new Error("Invalid test data: mockUser or responseUser is undefined");
    }

    expect(responseUser.id).toEqual(mockUser.id);
    expect(responseUser.email).toEqual(mockUser.email);
    expect(responseUser.full_name).toEqual(mockUser.full_name);
    expect(responseUser.username).toEqual(mockUser.username);
    expect(responseUser.role).toEqual(mockUser.role);
    expect(responseUser.avatar_url ?? null).toEqual(mockUser.avatar_url || null);

    // DB column is `created_at` but model defines `create_at`
    const responseDate = responseUser.created_at ?? responseUser.create_at;
    expect(new Date(responseDate as string).getTime()).not.toBeNaN();
}