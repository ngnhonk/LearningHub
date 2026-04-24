import { StatusCodes } from "http-status-codes";
import { QuestionRepository } from "./question.repository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import { v7 as uuidv7 } from "uuid";
import { Question } from "./question.model";

export class QuestionService {
  private questionRepository: QuestionRepository;

  constructor(repository: QuestionRepository = new QuestionRepository()) {
    this.questionRepository = repository;
  }

  // Retrieves all questions from the database
  async getAll(): Promise<ServiceResponse<Question[] | null>> {
    try {
      const result = await this.questionRepository.getAll();
      if (!result || result.length === 0) {
        return ServiceResponse.failure(
          "No Questions found",
          null,
          StatusCodes.NOT_FOUND,
        );
      }
      return ServiceResponse.success<Question[]>("Questions found", result);
    } catch (error) {
      const errorMessage = `Error finding all questions: $${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving questions.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Retrieves a single question by their ID
  async getById(id: string): Promise<ServiceResponse<Question | null>> {
    try {
      const result = await this.questionRepository.getById(id);
      if (!result) {
        return ServiceResponse.failure(
          "Question not found",
          null,
          StatusCodes.NOT_FOUND,
        );
      }
      return ServiceResponse.success<Question>("Question found", result);
    } catch (error) {
      const errorMessage = `Error finding question with id ${id}:, ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while finding question.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteById(id: string): Promise<ServiceResponse<number | null>> {
    try {
      const result = await this.questionRepository.deleteById(id);
      if (!result) {
        return ServiceResponse.failure(
          "Question not found",
          null,
          StatusCodes.NOT_FOUND,
        );
      }
      return ServiceResponse.success<number>("Question deleted", result);
    } catch (error) {
      const errorMessage = `Error finding question with id ${id}:, ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while deleting a question.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createQuestion(
    content: string,
    created_by: string,
  ): Promise<ServiceResponse<number | null>> {
    try {
      const id = uuidv7();
      const newQuestion = await this.questionRepository.createQuestion(
        id,
        content,
        created_by,
      );
      return ServiceResponse.success<number>(
        "Question created successfully",
        newQuestion,
      );
    } catch (error) {
      const errorMessage = `Error creating question: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while creating a question.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateQuestion(
    id: string,
    payload: Partial<Omit<Question, "id">>,
  ): Promise<ServiceResponse<Question | null>> {
    try {
      const existingQuestion = await this.questionRepository.getById(id);
      if (!existingQuestion) {
        return ServiceResponse.failure(
          "Question not found",
          null,
          StatusCodes.NOT_FOUND,
        );
      }
      await this.questionRepository.updateQuestion(id, payload);
      const updatedQuestion = await this.questionRepository.getById(id);
      return ServiceResponse.success<Question>(
        "Question updated successfully",
        updatedQuestion as Question,
      );
    } catch (error) {
      const errorMessage = `Error updating question with id ${id}: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while updating a question.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const questionService = new QuestionService();
