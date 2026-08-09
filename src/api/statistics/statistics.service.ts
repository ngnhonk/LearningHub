import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import db from "@/common/configs/database";

export class StatisticsService {
	// Student personal statistics
	async getStudentStatistics(userId: string): Promise<ServiceResponse<any | null>> {
		try {
			const attempts = await db("user_exam_attempts")
				.where({ user_id: userId })
				.whereIn("status", ["submitted", "time_out"]);

			if (!attempts || attempts.length === 0) {
				return ServiceResponse.failure("No completed attempts found for this student", null, StatusCodes.NOT_FOUND);
			}

			const totalAttempts = attempts.length;
			const totalScore = attempts.reduce((sum: number, a: any) => sum + Number(a.score), 0);
			const averageScore = totalScore / totalAttempts;

			// Count correct answers across all attempts
			const attemptIds = attempts.map((a: any) => a.id);
			const userAnswers = await db("user_answers").whereIn("attemp_id", attemptIds);
			const totalAnswers = userAnswers.length;
			const correctAnswers = userAnswers.filter((ua: any) => ua.is_correct).length;
			const correctRate = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;

			// Count unique exams taken
			const uniqueExams = new Set(attempts.map((a: any) => a.exam_id));

			return ServiceResponse.success("Student statistics found", {
				total_attempts: totalAttempts,
				average_score: Math.round(averageScore * 100) / 100,
				correct_rate: Math.round(correctRate * 100) / 100,
				exams_taken: uniqueExams.size,
			});
		} catch (error) {
			const errorMessage = `Error getting student statistics: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while retrieving student statistics.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	// Exam statistics
	async getExamStatistics(examId: string): Promise<ServiceResponse<any | null>> {
		try {
			const exam = await db("exams").where({ id: examId }).first();
			if (!exam) {
				return ServiceResponse.failure("Exam not found", null, StatusCodes.NOT_FOUND);
			}

			const attempts = await db("user_exam_attempts")
				.where({ exam_id: examId })
				.whereIn("status", ["submitted", "time_out"]);

			if (!attempts || attempts.length === 0) {
				return ServiceResponse.failure("No completed attempts found for this exam", null, StatusCodes.NOT_FOUND);
			}

			const totalAttempts = attempts.length;
			const scores = attempts.map((a: any) => Number(a.score));
			const totalScore = scores.reduce((sum: number, s: number) => sum + s, 0);
			const averageScore = totalScore / totalAttempts;
			const highestScore = Math.max(...scores);

			// Calculate pass rate based on exam's pass_percentage
			const passPercentage = Number(exam.pass_percentage);
			const totalMarks = Number(exam.total_marks);
			const passThreshold = (passPercentage / 100) * totalMarks;
			const passedAttempts = scores.filter((s: number) => s >= passThreshold).length;
			const passRate = (passedAttempts / totalAttempts) * 100;

			return ServiceResponse.success("Exam statistics found", {
				total_attempts: totalAttempts,
				average_score: Math.round(averageScore * 100) / 100,
				pass_rate: Math.round(passRate * 100) / 100,
				highest_score: highestScore,
			});
		} catch (error) {
			const errorMessage = `Error getting exam statistics: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while retrieving exam statistics.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	// Admin overview statistics
	async getAdminOverview(): Promise<ServiceResponse<any | null>> {
		try {
			const [studentsCount] = await db("users").where({ role: "student" }).count("id as count");
			const [totalUsersCount] = await db("users").count("id as count");
			const [subjectsCount] = await db("subjects").count("id as count");
			const [examsCount] = await db("exams").count("id as count");
			const [questionsCount] = await db("questions").count("id as count");
			const [attemptsCount] = await db("user_exam_attempts").count("id as count");

			const studentCountNum = Number(studentsCount?.count ?? 0);
			const totalUserNum = Number(totalUsersCount?.count ?? 0);

			return ServiceResponse.success("Admin overview found", {
				total_users: studentCountNum > 0 ? studentCountNum : totalUserNum,
				total_subjects: Number(subjectsCount?.count ?? 0),
				total_exams: Number(examsCount?.count ?? 0),
				total_questions: Number(questionsCount?.count ?? 0),
				total_attempts: Number(attemptsCount?.count ?? 0),
			});
		} catch (error) {
			const errorMessage = `Error getting admin overview: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while retrieving admin overview.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}
}

export const statisticsService = new StatisticsService();
