import { z } from "zod";

// ── Quiz Generation Request ───────────────────────────────────

export const quizGenerationSchema = z.object({
  pdfDocumentId: z.string().cuid("Invalid PDF document ID"),
  numberOfQuestions: z
    .number()
    .int()
    .min(1, "Minimum 1 question")
    .max(100, "Maximum 100 questions"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  questionType: z.enum(["MCQ", "TRUE_FALSE", "SHORT_ANSWER", "MIXED"]),
  topicFocus: z.string().max(200, "Topic focus too long").optional(),
  language: z.string().max(50).default("English"),
  includeExplanations: z.boolean().default(false),
  title: z.string().max(200).optional(),
});

export type QuizGenerationInput = z.infer<typeof quizGenerationSchema>;

// ── AI Response Validation ────────────────────────────────────

const aiQuestionSchema = z.object({
  type: z.enum(["mcq", "true_false", "short_answer"]),
  question: z
    .string()
    .min(5, "Question too short")
    .max(2000, "Question too long"),
  options: z
    .array(z.string().min(1).max(500))
    .min(2)
    .max(6)
    .optional(),
  correctAnswer: z
    .string()
    .min(1, "Correct answer cannot be empty")
    .max(1000),
  explanation: z.string().max(2000).optional(),
});

export const aiQuizResponseSchema = z.object({
  title: z.string().min(1).max(200),
  difficulty: z.enum(["easy", "medium", "hard"]),
  questions: z
    .array(aiQuestionSchema)
    .min(1, "Quiz must have at least 1 question")
    .max(100, "Quiz cannot exceed 100 questions"),
});

export type AIQuizResponseInput = z.infer<typeof aiQuizResponseSchema>;

// ── Quiz Update ───────────────────────────────────────────────

export const quizUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  isPublic: z.boolean().optional(),
});

export type QuizUpdateInput = z.infer<typeof quizUpdateSchema>;

// ── Quiz Attempt ──────────────────────────────────────────────

export const quizAttemptSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().cuid("Invalid question ID"),
        userAnswer: z.string().min(0).max(1000),
      })
    )
    .min(1, "Must provide at least one answer"),
  timeTaken: z.number().int().min(0).optional(),
});

export type QuizAttemptInput = z.infer<typeof quizAttemptSchema>;
