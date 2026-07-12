import type { AIMessage } from "../ai-provider.interface";
import type { SearchResult } from "../vector-store.service";

export type DifficultyLevel = "easy" | "medium" | "hard" | "mixed";
export type ExamLanguage = "vi" | "en";

export interface GenerateExamPromptInput {
	subjectName: string;
	topic?: string;
	numQuestions: number;
	difficulty: DifficultyLevel;
	language: ExamLanguage;
	additionalInstructions?: string;
	ragContext?: SearchResult[];
}

/**
 * Output JSON schema the AI must follow
 */
export const QUESTION_OUTPUT_SCHEMA = `{
  "questions": [
    {
      "content": "Nội dung câu hỏi",
      "difficulty": "easy | medium | hard",
      "explanation": "Giải thích ngắn gọn tại sao đáp án đúng",
      "answers": [
        { "content": "Đáp án A", "is_correct": false },
        { "content": "Đáp án B", "is_correct": true },
        { "content": "Đáp án C", "is_correct": false },
        { "content": "Đáp án D", "is_correct": false }
      ]
    }
  ]
}`;

/**
 * Build the system prompt
 */
function buildSystemPrompt(language: ExamLanguage): string {
	if (language === "vi") {
		return `Bạn là một chuyên gia giáo dục có kinh nghiệm trong việc tạo đề thi trắc nghiệm chất lượng cao.

Quy tắc:
1. Mỗi câu hỏi phải có nội dung rõ ràng, chính xác, không mơ hồ.
2. Mỗi câu hỏi phải có CHÍNH XÁC 4 đáp án (A, B, C, D).
3. Chỉ có ĐÚNG 1 đáp án đúng (is_correct: true) cho mỗi câu hỏi.
4. Các đáp án sai phải hợp lý và có tính đánh lạc hướng (plausible distractors).
5. Đáp án đúng nên được phân bố ngẫu nhiên ở các vị trí khác nhau.
6. Không tạo câu hỏi trùng lặp hoặc quá giống nhau.
7. Cung cấp giải thích ngắn gọn cho mỗi câu hỏi.
8. Trả về kết quả dưới dạng JSON hợp lệ theo đúng schema được yêu cầu.

Bạn PHẢI trả về JSON hợp lệ, không kèm markdown code blocks hay text thừa.`;
	}

	return `You are an experienced education expert specializing in creating high-quality multiple-choice exam questions.

Rules:
1. Each question must have clear, accurate, unambiguous content.
2. Each question must have EXACTLY 4 answer options (A, B, C, D).
3. Only EXACTLY 1 answer must be correct (is_correct: true) per question.
4. Wrong answers must be plausible distractors.
5. Correct answers should be randomly distributed across different positions.
6. Do not create duplicate or overly similar questions.
7. Provide a brief explanation for each question.
8. Return results as valid JSON following the required schema.

You MUST return valid JSON without markdown code blocks or extra text.`;
}

/**
 * Build the difficulty instruction
 */
function buildDifficultyInstruction(
	difficulty: DifficultyLevel,
	language: ExamLanguage,
): string {
	const instructions: Record<DifficultyLevel, Record<ExamLanguage, string>> = {
		easy: {
			vi: "Mức độ: DỄ — Câu hỏi kiến thức cơ bản, nhận biết, ghi nhớ.",
			en: "Difficulty: EASY — Basic knowledge, recognition, and recall questions.",
		},
		medium: {
			vi: "Mức độ: TRUNG BÌNH — Câu hỏi yêu cầu hiểu biết, phân tích, áp dụng.",
			en: "Difficulty: MEDIUM — Questions requiring understanding, analysis, and application.",
		},
		hard: {
			vi: "Mức độ: KHÓ — Câu hỏi yêu cầu tư duy phân tích, tổng hợp, đánh giá cao.",
			en: "Difficulty: HARD — Questions requiring advanced analysis, synthesis, and evaluation.",
		},
		mixed: {
			vi: "Mức độ: HỖN HỢP — Phân bố đều giữa dễ, trung bình và khó.",
			en: "Difficulty: MIXED — Evenly distributed between easy, medium, and hard.",
		},
	};

	return instructions[difficulty][language];
}

/**
 * Build RAG context from search results
 */
function buildRAGContext(
	results: SearchResult[],
	language: ExamLanguage,
): string {
	if (!results || results.length === 0) return "";

	const header =
		language === "vi"
			? "Tài liệu tham khảo liên quan (sử dụng để tạo câu hỏi chính xác):"
			: "Related reference materials (use to create accurate questions):";

	const contexts = results
		.map((r, i) => `[${i + 1}] ${r.content}`)
		.join("\n\n");

	return `${header}\n\n${contexts}`;
}

/**
 * Build the complete prompt messages for exam generation
 */
export function buildExamGenerationPrompt(
	input: GenerateExamPromptInput,
): AIMessage[] {
	const { subjectName, topic, numQuestions, difficulty, language, additionalInstructions, ragContext } = input;

	const systemPrompt = buildSystemPrompt(language);

	// Build user message
	const parts: string[] = [];

	if (language === "vi") {
		parts.push(`Hãy tạo ${numQuestions} câu hỏi trắc nghiệm cho môn: ${subjectName}`);
		if (topic) {
			parts.push(`Chủ đề cụ thể: ${topic}`);
		}
	} else {
		parts.push(`Generate ${numQuestions} multiple-choice questions for subject: ${subjectName}`);
		if (topic) {
			parts.push(`Specific topic: ${topic}`);
		}
	}

	parts.push(buildDifficultyInstruction(difficulty, language));

	// Add RAG context
	if (ragContext && ragContext.length > 0) {
		parts.push(buildRAGContext(ragContext, language));
	}

	// Additional user instructions
	if (additionalInstructions) {
		const header = language === "vi" ? "Yêu cầu bổ sung:" : "Additional instructions:";
		parts.push(`${header} ${additionalInstructions}`);
	}

	// Output format
	const formatHeader =
		language === "vi"
			? "Trả về JSON theo đúng schema sau:"
			: "Return JSON following this exact schema:";
	parts.push(`${formatHeader}\n${QUESTION_OUTPUT_SCHEMA}`);

	return [
		{ role: "system", content: systemPrompt },
		{ role: "user", content: parts.join("\n\n") },
	];
}
