import { StatusCodes } from "http-status-codes";
import type { Mock } from "vitest";

import type { User } from "@/api/user/user.model";
import { UserRepository } from "@/api/user/user.repository";
import { UserService } from "@/api/user/user.service";

vi.mock("@/api/user/user.repository");

describe("userService", () => {
    let userServiceInstance: UserService;
    let userRepositoryInstance: UserRepository;

    const mockUsers: User[] = [
        {
            id: "019db44e-4581-70ca-978f-bebf6e23fb57",
            email: "alice@example.com",
            full_name: "Alice Wonderland",
            username: "alice",
            hashed_password: "$2b$10$hashedpassword1",
            role: "student",
            avatar_url: "",
            create_at: new Date(),
        },
        {
            id: "019db44e-4581-70ca-978f-bebf6e23fb58",
            email: "bob@example.com",
            full_name: "Bob Builder",
            username: "bob",
            hashed_password: "$2b$10$hashedpassword2",
            role: "admin",
            avatar_url: "",
            create_at: new Date(),
        },
    ];

    beforeEach(() => {
        userRepositoryInstance = new UserRepository();
        userServiceInstance = new UserService(userRepositoryInstance);
    });

    describe("getAll", () => {
        it("return all users", async () => {
            // Arrange
            (userRepositoryInstance.getAll as Mock).mockReturnValue(mockUsers);

            // Act
            const result = await userServiceInstance.getAll();

            // Assert
            expect(result.statusCode).toEqual(StatusCodes.OK);
            expect(result.success).toBeTruthy();
            expect(result.message).equals("Users found");
            expect(result.responseObject).toEqual(mockUsers);
        });

        it("returns a not found error for no users found", async () => {
            // Arrange
            (userRepositoryInstance.getAll as Mock).mockReturnValue(null);

            // Act
            const result = await userServiceInstance.getAll();

            // Assert
            expect(result.statusCode).toEqual(StatusCodes.NOT_FOUND);
            expect(result.success).toBeFalsy();
            expect(result.message).equals("No Users found");
            expect(result.responseObject).toBeNull();
        });

        it("handles errors for getAll", async () => {
            // Arrange
            (userRepositoryInstance.getAll as Mock).mockRejectedValue(new Error("Database error"));

            // Act
            const result = await userServiceInstance.getAll();

            // Assert
            expect(result.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
            expect(result.success).toBeFalsy();
            expect(result.message).equals("An error occurred while retrieving users.");
            expect(result.responseObject).toBeNull();
        });
    });

    describe("getById", () => {
        it("returns a user for a valid ID", async () => {
            // Arrange
            const testId = "019db44e-4581-70ca-978f-bebf6e23fb57";
            const mockUser = mockUsers.find((user) => user.id === testId);
            (userRepositoryInstance.getById as Mock).mockReturnValue(mockUser);

            // Act
            const result = await userServiceInstance.getById(testId);

            // Assert
            expect(result.statusCode).toEqual(StatusCodes.OK);
            expect(result.success).toBeTruthy();
            expect(result.message).equals("User found");
            expect(result.responseObject).toEqual(mockUser);
        });

        it("handles errors for getById", async () => {
            // Arrange
            const testId = "019db44e-4581-70ca-978f-bebf6e23fb57";
            (userRepositoryInstance.getById as Mock).mockRejectedValue(new Error("Database error"));

            // Act
            const result = await userServiceInstance.getById(testId);

            // Assert
            expect(result.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
            expect(result.success).toBeFalsy();
            expect(result.message).equals("An error occurred while finding user.");
            expect(result.responseObject).toBeNull();
        });

        it("returns a not found error for non-existent ID", async () => {
            // Arrange
            const testId = "00000000-0000-0000-0000-000000000000";
            (userRepositoryInstance.getById as Mock).mockReturnValue(null);

            // Act
            const result = await userServiceInstance.getById(testId);

            // Assert
            expect(result.statusCode).toEqual(StatusCodes.NOT_FOUND);
            expect(result.success).toBeFalsy();
            expect(result.message).equals("User not found");
            expect(result.responseObject).toBeNull();
        });
    });
});