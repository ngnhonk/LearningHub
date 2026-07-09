import { logger } from "@/server";
import db from "@/common/configs/database";
import { vectorStoreService, type DocumentPayload } from "./vector-store.service";

/**
 * Sync existing questions from MySQL into Qdrant vector store
 * This enables RAG to reference past questions for style/deduplication
 */
export class QuestionSyncService {
	/**
	 * Sync all questions (with their answers) from MySQL to Qdrant
	 */
	async syncAllQuestions(): Promise<{ synced: number }> {
		try {
			// Fetch questions with their answers
			const questions = await db("questions")
				.select("questions.id", "questions.content", "questions.created_by")
				.orderBy("questions.created_at", "desc");

			if (!questions || questions.length === 0) {
				logger.info("No questions to sync");
				return { synced: 0 };
			}

			const documents: DocumentPayload[] = [];

			for (const question of questions) {
				const answers = await db("answers")
					.where({ question_id: question.id })
					.select("content", "is_correct");

				// Find subject_id via exam_questions → exams
				const examLink = await db("exam_questions")
					.join("exams", "exam_questions.exam_id", "exams.id")
					.where("exam_questions.question_id", question.id)
					.select("exams.subject_id")
					.first();

				// Build a rich text representation
				const answerTexts = answers
					.map(
						(a: { content: string; is_correct: boolean | number }) =>
							`${a.is_correct ? "[Đúng]" : "[Sai]"} ${a.content}`,
					)
					.join("\n");

				const fullContent = `Câu hỏi: ${question.content}\nĐáp án:\n${answerTexts}`;

				documents.push({
					content: fullContent,
					source_type: "question",
					subject_id: examLink?.subject_id || "",
					metadata: {
						question_id: question.id,
						created_by: question.created_by,
					},
				});
			}

			// Upsert in batches
			const batchSize = 50;
			let totalSynced = 0;

			for (let i = 0; i < documents.length; i += batchSize) {
				const batch = documents.slice(i, i + batchSize);
				const result = await vectorStoreService.upsertDocuments(batch);
				totalSynced += result.upserted;
				logger.info(
					`Synced batch ${Math.floor(i / batchSize) + 1}: ${result.upserted} questions`,
				);
			}

			logger.info(`Total synced: ${totalSynced} questions`);
			return { synced: totalSynced };
		} catch (error) {
			logger.error(
				`Error syncing questions to vector store: ${(error as Error).message}`,
			);
			throw error;
		}
	}

	/**
	 * Sync questions for a specific subject
	 */
	async syncBySubjectId(
		subjectId: string,
	): Promise<{ synced: number }> {
		try {
			const questions = await db("questions")
				.join(
					"exam_questions",
					"questions.id",
					"exam_questions.question_id",
				)
				.join("exams", "exam_questions.exam_id", "exams.id")
				.where("exams.subject_id", subjectId)
				.select("questions.id", "questions.content", "questions.created_by")
				.groupBy("questions.id");

			if (!questions || questions.length === 0) {
				return { synced: 0 };
			}

			const documents: DocumentPayload[] = [];

			for (const question of questions) {
				const answers = await db("answers")
					.where({ question_id: question.id })
					.select("content", "is_correct");

				const answerTexts = answers
					.map(
						(a: { content: string; is_correct: boolean | number }) =>
							`${a.is_correct ? "[Đúng]" : "[Sai]"} ${a.content}`,
					)
					.join("\n");

				const fullContent = `Câu hỏi: ${question.content}\nĐáp án:\n${answerTexts}`;

				documents.push({
					content: fullContent,
					source_type: "question",
					subject_id: subjectId,
					metadata: {
						question_id: question.id,
						created_by: question.created_by,
					},
				});
			}

			const result = await vectorStoreService.upsertDocuments(documents);
			return { synced: result.upserted };
		} catch (error) {
			logger.error(
				`Error syncing questions for subject ${subjectId}: ${(error as Error).message}`,
			);
			throw error;
		}
	}
}

export const questionSyncService = new QuestionSyncService();
