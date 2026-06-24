import type { AIQuizResponse } from "@/types/quiz";

// ── Configurable AI Provider Interface ───────────────────────

export interface GenerateQuizParams {
  extractedText: string;
  numberOfQuestions: number;
  difficulty: "easy" | "medium" | "hard";
  questionType: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "MIXED";
  topicFocus?: string;
  language: string;
  includeExplanations: boolean;
}

export interface AIProvider {
  name: string;
  generateQuiz(params: GenerateQuizParams): Promise<AIQuizResponse>;
}
