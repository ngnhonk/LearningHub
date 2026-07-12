import { StatusCodes } from "http-status-codes";
import { v7 as uuidv7 } from "uuid";
import db from "@/common/configs/database";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import { createAIProvider, type AIProviderType } from "@/common/ai/ai-provider.factory";
import { vectorStoreService } from "@/common/ai/vector-store.service";
import { documentProcessorService } from "@/common/ai/document-processor.service";
import { questionSyncService } from "@/common/ai/question-sync.service";
import { buildExamGenerationPrompt, type DifficultyLevel, type ExamLanguage } from "@/common/ai/prompts/prompt-templates";
import { parseAIResponse } from "@/common/ai/prompts/response-parser";
import type {
	GenerateExamResponse,
	UploadDocumentResponse,
	SyncQuestionsResponse,
} from "./ai-generation.model";

const MAX_RETRIES = 3;

export class AIGenerationService {
	/**
	 * Generate exam questions using AI + RAG
	 */
	async generateExam(params: {
		subject_id: string;
		topic?: string;
		num_questions: number;
		difficulty: DifficultyLevel;
		language: ExamLanguage;
		exam_title?: string;
		exam_duration_minutes?: number;
		additional_instructions?: string;
		provider?: AIProviderType;
		auto_save: boolean;
		created_by: string;
	}): Promise<ServiceResponse<GenerateExamResponse | null>> {
		const startTime = Date.now();

		try {
			// 1. Get subject info
			const subject = await db("subjects")
				.where({ id: params.subject_id })
				.first();

			if (!subject) {
				return ServiceResponse.failure(
					"Subject not found",
					null,
					StatusCodes.NOT_FOUND,
				);
			}

			// 2. Create AI provider
			const provider = createAIProvider(params.provider);

			// 3. RAG: search for relevant context
			let ragContext = undefined;
			let ragUsed = false;

			try {
				const searchQuery = params.topic
					? `${subject.name} ${params.topic}`
					: subject.name;

				const searchResults = await vectorStoreService.searchSimilar(
					searchQuery,
					10,
					{ subject_id: params.subject_id },
				);

				if (searchResults.length > 0) {
					ragContext = searchResults;
					ragUsed = true;
					logger.info(
						`RAG: Found ${searchResults.length} relevant documents for context`,
					);
				}
			} catch (ragError) {
				// RAG is optional — continue without it
				logger.warn(
					`RAG search failed (continuing without context): ${(ragError as Error).message}`,
				);
			}

			// 4. Build prompt
			const messages = buildExamGenerationPrompt({
				subjectName: subject.name,
				topic: params.topic,
				numQuestions: params.num_questions,
				difficulty: params.difficulty,
				language: params.language,
				additionalInstructions: params.additional_instructions,
				ragContext,
			});

			// 5. Call LLM with retry logic
			let generatedExam;
			let modelUsed = "";
			let lastError: Error | null = null;

			for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
				try {
					const completion = await provider.generateCompletion(
						messages,
						{
							temperature: 0.7,
							max_tokens: params.num_questions * 500, // ~500 tokens per question
							response_format: { type: "json_object" },
						},
					);

					modelUsed = completion.model;
					generatedExam = parseAIResponse(completion.content);

					logger.info(
						`AI generation succeeded on attempt ${attempt}: ${generatedExam.questions.length} questions`,
					);
					break;
				} catch (parseError) {
					lastError = parseError as Error;
					logger.warn(
						`AI generation attempt ${attempt}/${MAX_RETRIES} failed: ${lastError.message}`,
					);

					if (attempt === MAX_RETRIES) {
						return ServiceResponse.failure(
							`AI generation failed after ${MAX_RETRIES} attempts: ${lastError.message}`,
							null,
							StatusCodes.INTERNAL_SERVER_ERROR,
						);
					}
				}
			}

			if (!generatedExam) {
				return ServiceResponse.failure(
					"AI generation failed: no response",
					null,
					StatusCodes.INTERNAL_SERVER_ERROR,
				);
			}

			// 6. (Optional) Save to MySQL
			let examId: string | undefined;

			if (params.auto_save) {
				examId = await this.saveGeneratedExam(
					generatedExam,
					params,
				);
			}

			// 7. Build response
			const response: GenerateExamResponse = {
				exam_id: examId,
				generated_questions: generatedExam.questions.map((q) => ({
					content: q.content,
					difficulty: q.difficulty || "medium",
					explanation: q.explanation,
					answers: q.answers.map((a) => ({
						content: a.content,
						is_correct: a.is_correct,
					})),
				})),
				metadata: {
					provider_used: provider.name,
					model_used: modelUsed,
					generation_time_ms: Date.now() - startTime,
					rag_context_used: ragUsed,
					total_questions: generatedExam.questions.length,
				},
			};

			return ServiceResponse.success(
				"Exam generated successfully",
				response,
			);
		} catch (error) {
			const errorMessage = `Error generating exam: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while generating exam",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	/**
	 * Save AI-generated exam to MySQL within a transaction
	 */
	private async saveGeneratedExam(
		generatedExam: { questions: Array<{ content: string; difficulty?: string; explanation?: string; answers: Array<{ content: string; is_correct: boolean }> }> },
		params: {
			subject_id: string;
			exam_title?: string;
			exam_duration_minutes?: number;
			num_questions: number;
			created_by: string;
		},
	): Promise<string> {
		const examId = uuidv7();

		await db.transaction(async (trx: any) => {
			// Create exam
			await trx("exams").insert({
				id: examId,
				title:
					params.exam_title ||
					`AI Generated Exam - ${new Date().toLocaleDateString()}`,
				description: `Auto-generated exam with ${generatedExam.questions.length} questions`,
				subject_id: params.subject_id,
				duration_minutes: params.exam_duration_minutes || 60,
				total_marks: generatedExam.questions.length,
				pass_percentage: 50,
				is_published: false,
				created_by: params.created_by,
			});

			// Create questions and answers
			for (const q of generatedExam.questions) {
				const questionId = uuidv7();

				await trx("questions").insert({
					id: questionId,
					content: q.content,
					created_by: params.created_by,
				});

				for (const answer of q.answers) {
					await trx("answers").insert({
						id: uuidv7(),
						question_id: questionId,
						content: answer.content,
						is_correct: answer.is_correct,
					});
				}

				await trx("exam_questions").insert({
					id: uuidv7(),
					exam_id: examId,
					question_id: questionId,
				});
			}
		});

		logger.info(`Saved generated exam to DB: ${examId}`);
		return examId;
	}

	/**
	 * Upload and process a markdown document into the vector store
	 */
	async uploadDocument(
		fileContent: string,
		subjectId: string,
		filename: string,
	): Promise<ServiceResponse<UploadDocumentResponse | null>> {
		try {
			// Verify subject exists
			const subject = await db("subjects")
				.where({ id: subjectId })
				.first();

			if (!subject) {
				return ServiceResponse.failure(
					"Subject not found",
					null,
					StatusCodes.NOT_FOUND,
				);
			}

			// Initialize collection if needed
			await vectorStoreService.initializeCollection();

			// Process document into chunks
			const documents = documentProcessorService.processMarkdown(
				fileContent,
				subjectId,
				{ sourceFilename: filename },
			);

			if (documents.length === 0) {
				return ServiceResponse.failure(
					"Document produced no content chunks",
					null,
					StatusCodes.BAD_REQUEST,
				);
			}

			// Upsert into vector store
			const result = await vectorStoreService.upsertDocuments(documents);

			return ServiceResponse.success<UploadDocumentResponse>(
				"Document uploaded and processed successfully",
				{
					chunks_processed: result.upserted,
					subject_id: subjectId,
				},
			);
		} catch (error) {
			const errorMessage = `Error uploading document: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while uploading document",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	/**
	 * Sync existing questions from MySQL to the vector store
	 */
	async syncQuestions(
		subjectId?: string,
	): Promise<ServiceResponse<SyncQuestionsResponse | null>> {
		try {
			// Initialize collection if needed
			await vectorStoreService.initializeCollection();

			let result;
			if (subjectId) {
				// Verify subject exists
				const subject = await db("subjects")
					.where({ id: subjectId })
					.first();

				if (!subject) {
					return ServiceResponse.failure(
						"Subject not found",
						null,
						StatusCodes.NOT_FOUND,
					);
				}

				result = await questionSyncService.syncBySubjectId(subjectId);
			} else {
				result = await questionSyncService.syncAllQuestions();
			}

			return ServiceResponse.success<SyncQuestionsResponse>(
				`Synced ${result.synced} questions to vector store`,
				result,
			);
		} catch (error) {
			const errorMessage = `Error syncing questions: ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while syncing questions",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}
}

export const aiGenerationService = new AIGenerationService();
