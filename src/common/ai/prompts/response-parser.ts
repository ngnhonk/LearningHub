import { z } from "zod";
import { logger } from "@/server";

/**
 * Schema for a single generated answer
 */
const GeneratedAnswerSchema = z.object({
	content: z.string().min(1),
	is_correct: z.boolean(),
});

/**
 * Schema for a single generated question
 */
const GeneratedQuestionSchema = z.object({
	content: z.string().min(1),
	difficulty: z.enum(["easy", "medium", "hard"]).optional().default("medium"),
	explanation: z.string().optional().default(""),
	answers: z
		.array(GeneratedAnswerSchema)
		.min(2)
		.max(6)
		.refine(
			(answers) => answers.filter((a) => a.is_correct).length === 1,
			{
				message: "Each question must have exactly 1 correct answer",
			},
		),
});

/**
 * Schema for the full AI response
 */
const GeneratedExamSchema = z.object({
	questions: z.array(GeneratedQuestionSchema).min(1),
});

export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;
export type GeneratedAnswer = z.infer<typeof GeneratedAnswerSchema>;
export type GeneratedExam = z.infer<typeof GeneratedExamSchema>;

/**
 * Parse and validate the AI response into structured question data
 */
export function parseAIResponse(rawContent: string): GeneratedExam {
	// Step 1: Extract JSON from potential markdown wrapping
	let jsonString = extractJSON(rawContent);

	// Step 2: Parse JSON
	let parsed: unknown;
	try {
		parsed = JSON.parse(jsonString);
	} catch {
		// Try to fix common JSON issues
		jsonString = fixCommonJSONIssues(jsonString);
		parsed = JSON.parse(jsonString);
	}

	// Step 3: Validate with Zod
	const result = GeneratedExamSchema.safeParse(parsed);

	if (!result.success) {
		const errors = result.error.issues
			.map((i) => `${i.path.join(".")}: ${i.message}`)
			.join("; ");
		throw new Error(`AI response validation failed: ${errors}`);
	}

	// Step 4: Post-process cleanup
	const exam = result.data;
	for (const question of exam.questions) {
		// Trim whitespace
		question.content = question.content.trim();
		for (const answer of question.answers) {
			answer.content = answer.content.trim();
		}
		if (question.explanation) {
			question.explanation = question.explanation.trim();
		}
	}

	logger.info(
		`Parsed ${exam.questions.length} questions from AI response`,
	);
	return exam;
}

/**
 * Extract JSON from markdown code blocks or raw text
 */
function extractJSON(text: string): string {
	// Remove markdown code blocks
	const jsonBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
	if (jsonBlockMatch) {
		return jsonBlockMatch[1].trim();
	}

	// Try to find JSON object/array directly
	const firstBrace = text.indexOf("{");
	const lastBrace = text.lastIndexOf("}");

	if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
		return text.slice(firstBrace, lastBrace + 1);
	}

	// Return as-is and let JSON.parse handle the error
	return text.trim();
}

/**
 * Fix common JSON formatting issues from LLM outputs
 */
function fixCommonJSONIssues(jsonStr: string): string {
	let fixed = jsonStr;

	// Remove trailing commas before } or ]
	fixed = fixed.replace(/,\s*([}\]])/g, "$1");

	// Fix single quotes → double quotes (simple cases)
	// Only if no double quotes are present at all
	if (!fixed.includes('"') && fixed.includes("'")) {
		fixed = fixed.replace(/'/g, '"');
	}

	return fixed;
}
