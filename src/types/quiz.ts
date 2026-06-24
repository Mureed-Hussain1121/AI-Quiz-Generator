// ============================================================
// AI-GENERATED QUIZ TYPES
// ============================================================

export type AIQuestionType = "mcq" | "true_false" | "short_answer";

export interface AIQuestion {
  type: AIQuestionType;
  question: string;
  options?: string[]; // Only for MCQ
  correctAnswer: string;
  explanation?: string;
}

export interface AIQuizResponse {
  title: string;
  difficulty: "easy" | "medium" | "hard";
  questions: AIQuestion[];
}

// ============================================================
// QUIZ GENERATION REQUEST
// ============================================================

export interface QuizGenerationOptions {
  pdfDocumentId: string;
  numberOfQuestions: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  questionType: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "MIXED";
  topicFocus?: string;
  language?: string;
  includeExplanations: boolean;
  title?: string;
}

// ============================================================
// QUIZ ATTEMPT TYPES
// ============================================================

export interface SubmittedAnswer {
  questionId: string;
  userAnswer: string;
}

export interface AttemptResult {
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string | null;
}

// ============================================================
// API RESPONSE WRAPPER
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================
// PLAN LIMITS
// ============================================================

export interface PlanLimits {
  pdfUploadsPerMonth: number;
  quizGenerationsPerMonth: number;
  maxQuestionsPerQuiz: number;
  canExportPDF: boolean;
  canShareQuiz: boolean;
  canUseMixedTypes: boolean;
  canUseExplanations: boolean;
  canUseAdvancedDifficulty: boolean;
}

export const FREE_PLAN_LIMITS: PlanLimits = {
  pdfUploadsPerMonth: parseInt(process.env.FREE_PDF_UPLOADS_PER_MONTH ?? "3"),
  quizGenerationsPerMonth: parseInt(process.env.FREE_QUIZ_GENERATIONS_PER_MONTH ?? "5"),
  maxQuestionsPerQuiz: parseInt(process.env.FREE_MAX_QUESTIONS ?? "10"),
  canExportPDF: false,
  canShareQuiz: false,
  canUseMixedTypes: false,
  canUseExplanations: false,
  canUseAdvancedDifficulty: false,
};

export const PREMIUM_PLAN_LIMITS: PlanLimits = {
  pdfUploadsPerMonth: parseInt(process.env.PREMIUM_PDF_UPLOADS_PER_MONTH ?? "50"),
  quizGenerationsPerMonth: parseInt(process.env.PREMIUM_QUIZ_GENERATIONS_PER_MONTH ?? "100"),
  maxQuestionsPerQuiz: parseInt(process.env.PREMIUM_MAX_QUESTIONS ?? "100"),
  canExportPDF: true,
  canShareQuiz: true,
  canUseMixedTypes: true,
  canUseExplanations: true,
  canUseAdvancedDifficulty: true,
};
