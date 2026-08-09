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

	// Comprehensive Learning Analytics for Teachers & Admins
	async getLearningAnalytics(
		subjectId?: string,
		timeframe: "7days" | "30days" | "all" = "all",
	): Promise<ServiceResponse<any | null>> {
		try {
			// Base query for completed attempts
			let attemptsQuery = db("user_exam_attempts as uea")
				.join("exams as e", "uea.exam_id", "e.id")
				.join("subjects as s", "e.subject_id", "s.id")
				.join("users as u", "uea.user_id", "u.id")
				.whereIn("uea.status", ["submitted", "time_out"])
				.select(
					"uea.id as attempt_id",
					"uea.user_id",
					"uea.exam_id",
					"uea.score",
					"uea.time_spent_seconds",
					"uea.started_at",
					"uea.submitted_at",
					"uea.status",
					"e.title as exam_title",
					"e.subject_id",
					"e.total_marks",
					"e.pass_percentage",
					"s.name as subject_name",
					"u.full_name",
					"u.username",
				);

			if (subjectId) {
				attemptsQuery = attemptsQuery.where("e.subject_id", subjectId);
			}

			if (timeframe === "7days") {
				const date7DaysAgo = new Date();
				date7DaysAgo.setDate(date7DaysAgo.getDate() - 7);
				attemptsQuery = attemptsQuery.where("uea.started_at", ">=", date7DaysAgo);
			} else if (timeframe === "30days") {
				const date30DaysAgo = new Date();
				date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);
				attemptsQuery = attemptsQuery.where("uea.started_at", ">=", date30DaysAgo);
			}

			const rawAttempts = await attemptsQuery;

			// Fetch all subjects & exams for full context
			let subjects = await db("subjects").select("*");
			if (subjectId) {
				subjects = subjects.filter((s: any) => s.id === subjectId);
			}
			let examsQuery = db("exams as e").join("subjects as s", "e.subject_id", "s.id").select("e.*", "s.name as subject_name");
			if (subjectId) {
				examsQuery = examsQuery.where("e.subject_id", subjectId);
			}
			const exams = await examsQuery;

			// --- 1. Summary Calculation ---
			const totalAttemptsCount = rawAttempts.length;
			let totalScoreSum = 0;
			let totalTimeSum = 0;
			let passedCount = 0;

			rawAttempts.forEach((att: any) => {
				const score = Number(att.score || 0);
				const timeSec = Number(att.time_spent_seconds || 0);
				const passPercentage = Number(att.pass_percentage || 50);
				const totalMarks = Number(att.total_marks || 100);
				const passThreshold = (passPercentage / 100) * totalMarks;

				totalScoreSum += score;
				totalTimeSum += timeSec;
				if (score >= passThreshold) {
					passedCount++;
				}
			});

			const overallAvgScore = totalAttemptsCount > 0 ? Math.round((totalScoreSum / totalAttemptsCount) * 100) / 100 : 0;
			const overallAvgTimeSeconds = totalAttemptsCount > 0 ? Math.round(totalTimeSum / totalAttemptsCount) : 0;
			const overallPassRate = totalAttemptsCount > 0 ? Math.round((passedCount / totalAttemptsCount) * 100) : 0;

			// --- 2. Subject Stats Calculation ---
			const subjectStats = subjects.map((subj: any) => {
				const subjAttempts = rawAttempts.filter((a: any) => a.subject_id === subj.id);
				const subjExams = exams.filter((e: any) => e.subject_id === subj.id);
				const count = subjAttempts.length;

				let subjScoreSum = 0;
				let subjTimeSum = 0;
				let subjPassed = 0;

				subjAttempts.forEach((a: any) => {
					const score = Number(a.score || 0);
					const passPercentage = Number(a.pass_percentage || 50);
					const totalMarks = Number(a.total_marks || 100);
					const threshold = (passPercentage / 100) * totalMarks;

					subjScoreSum += score;
					subjTimeSum += Number(a.time_spent_seconds || 0);
					if (score >= threshold) subjPassed++;
				});

				return {
					subject_id: subj.id,
					subject_name: subj.name,
					total_exams: subjExams.length,
					total_attempts: count,
					avg_score: count > 0 ? Math.round((subjScoreSum / count) * 100) / 100 : 0,
					avg_time_seconds: count > 0 ? Math.round(subjTimeSum / count) : 0,
					pass_rate: count > 0 ? Math.round((subjPassed / count) * 100) : 0,
				};
			});

			// --- 3. Exam Stats Calculation ---
			const examStats = exams.map((ex: any) => {
				const exAttempts = rawAttempts.filter((a: any) => a.exam_id === ex.id);
				const count = exAttempts.length;

				let exScoreSum = 0;
				let exTimeSum = 0;
				let exPassed = 0;
				let highest = 0;
				let lowest = count > 0 ? Number(exAttempts[0].score || 0) : 0;

				exAttempts.forEach((a: any) => {
					const score = Number(a.score || 0);
					const timeSec = Number(a.time_spent_seconds || 0);
					const passPercentage = Number(ex.pass_percentage || 50);
					const totalMarks = Number(ex.total_marks || 100);
					const threshold = (passPercentage / 100) * totalMarks;

					exScoreSum += score;
					exTimeSum += timeSec;
					if (score > highest) highest = score;
					if (score < lowest) lowest = score;
					if (score >= threshold) exPassed++;
				});

				return {
					exam_id: ex.id,
					exam_title: ex.title,
					subject_name: ex.subject_name,
					total_attempts: count,
					avg_score: count > 0 ? Math.round((exScoreSum / count) * 100) / 100 : 0,
					avg_time_seconds: count > 0 ? Math.round(exTimeSum / count) : 0,
					highest_score: highest,
					lowest_score: count > 0 ? lowest : 0,
					pass_rate: count > 0 ? Math.round((exPassed / count) * 100) : 0,
				};
			});

			// --- 4. Time Series Calculation (Daily & Monthly trends) ---
			// Daily trends (Last 7 days)
			const dailyMap: Record<string, { attempts_count: number; total_score: number }> = {};
			for (let i = 6; i >= 0; i--) {
				const d = new Date();
				d.setDate(d.getDate() - i);
				const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
				dailyMap[dateStr] = { attempts_count: 0, total_score: 0 };
			}

			// Monthly trends (Last 6 months)
			const monthlyMap: Record<string, { attempts_count: number; total_score: number }> = {};
			for (let i = 5; i >= 0; i--) {
				const d = new Date();
				d.setMonth(d.getMonth() - i);
				const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
				monthlyMap[monthStr] = { attempts_count: 0, total_score: 0 };
			}

			rawAttempts.forEach((att: any) => {
				const dateObj = new Date(att.started_at || att.submitted_at);
				const dateStr = dateObj.toISOString().split("T")[0];
				const monthStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
				const score = Number(att.score || 0);

				if (dailyMap[dateStr]) {
					dailyMap[dateStr].attempts_count++;
					dailyMap[dateStr].total_score += score;
				}
				if (monthlyMap[monthStr]) {
					monthlyMap[monthStr].attempts_count++;
					monthlyMap[monthStr].total_score += score;
				}
			});

			const time_series = {
				daily: Object.keys(dailyMap).map((date) => {
					const item = dailyMap[date];
					return {
						label: date.substring(5), // MM-DD
						attempts_count: item.attempts_count,
						avg_score: item.attempts_count > 0 ? Math.round((item.total_score / item.attempts_count) * 10) / 10 : 0,
					};
				}),
				monthly: Object.keys(monthlyMap).map((month) => {
					const item = monthlyMap[month];
					return {
						label: `T${parseInt(month.substring(5), 10)}`, // e.g. T8
						attempts_count: item.attempts_count,
						avg_score: item.attempts_count > 0 ? Math.round((item.total_score / item.attempts_count) * 10) / 10 : 0,
					};
				}),
			};

			// --- 5. Top Students Calculation ---
			const studentMap: Record<string, { full_name: string; username: string; attempts: number; score_sum: number; passed: number }> = {};

			rawAttempts.forEach((att: any) => {
				const uid = att.user_id;
				if (!studentMap[uid]) {
					studentMap[uid] = {
						full_name: att.full_name,
						username: att.username,
						attempts: 0,
						score_sum: 0,
						passed: 0,
					};
				}
				studentMap[uid].attempts++;
				studentMap[uid].score_sum += Number(att.score || 0);

				const passPercentage = Number(att.pass_percentage || 50);
				const totalMarks = Number(att.total_marks || 100);
				if (Number(att.score || 0) >= (passPercentage / 100) * totalMarks) {
					studentMap[uid].passed++;
				}
			});

			const top_students = Object.keys(studentMap)
				.map((uid) => {
					const s = studentMap[uid];
					return {
						user_id: uid,
						full_name: s.full_name,
						username: s.username,
						attempts_count: s.attempts,
						avg_score: Math.round((s.score_sum / s.attempts) * 100) / 100,
						passed_count: s.passed,
					};
				})
				.sort((a, b) => b.avg_score - a.avg_score || b.attempts_count - a.attempts_count)
				.slice(0, 10);

			return ServiceResponse.success("Learning analytics retrieved successfully", {
				summary: {
					total_attempts: totalAttemptsCount,
					overall_avg_score: overallAvgScore,
					overall_avg_time_seconds: overallAvgTimeSeconds,
					overall_pass_rate: overallPassRate,
				},
				subject_stats: subjectStats,
				exam_stats: examStats,
				time_series: time_series,
				top_students: top_students,
			});
		} catch (error) {
			const errorMessage = `Error getting learning analytics: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while retrieving learning analytics.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}
}

export const statisticsService = new StatisticsService();
