import { NextRequest } from "next/server";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { quizGenerationSchema } from "@/lib/validations/quiz";
import { getAIProvider } from "@/lib/ai/provider";
import { canGenerateQuiz, incrementQuizUsage, checkPremiumFeature } from "@/lib/usage";
import { checkRateLimit, QUIZ_GENERATION_RATE_LIMIT } from "@/lib/rate-limit";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const userId = session!.user.id;
  const subscriptionStatus = session!.user.subscriptionStatus;

  // ── Rate limiting ─────────────────────────────────────────
  const rateLimit = checkRateLimit(`quiz-gen:${userId}`, QUIZ_GENERATION_RATE_LIMIT);
  if (!rateLimit.success) {
    return apiError(
      "You're generating quizzes too fast. Please wait a few minutes.",
      429
    );
  }

  // ── Parse and validate request ────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = quizGenerationSchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => i.message);
    return apiError(issues[0], 400);
  }

  const options = parsed.data;

  // ── Premium feature checks ────────────────────────────────

  // Mixed question types: premium only
  if (options.questionType === "MIXED") {
    const check = checkPremiumFeature(subscriptionStatus, "canUseMixedTypes");
    if (!check.allowed) return apiError(check.reason!, 403);
  }

  // Explanations: premium only
  if (options.includeExplanations) {
    const check = checkPremiumFeature(subscriptionStatus, "canUseExplanations");
    if (!check.allowed) return apiError(check.reason!, 403);
  }

  // ── Monthly usage check ───────────────────────────────────
  const usageCheck = await canGenerateQuiz(
    userId,
    subscriptionStatus,
    options.numberOfQuestions
  );
  if (!usageCheck.allowed) {
    return apiError(usageCheck.reason!, 403);
  }

  // ── Fetch PDF document ────────────────────────────────────
  const pdf = await prisma.pDFDocument.findUnique({
    where: { id: options.pdfDocumentId },
    select: {
      id: true,
      userId: true,
      originalName: true,
      extractedText: true,
      wordCount: true,
    },
  });

  if (!pdf) {
    return apiError("PDF document not found", 404);
  }

  // Ownership check
  if (pdf.userId !== userId) {
    return apiError("You do not have permission to use this PDF", 403);
  }

  if (!pdf.extractedText || pdf.extractedText.trim().length < 50) {
    return apiError(
      "This PDF does not have enough readable text to generate a quiz.",
      422
    );
  }

  // ── Call AI provider ──────────────────────────────────────
  let aiQuiz;
  try {
    const provider = getAIProvider();
    aiQuiz = await provider.generateQuiz({
      extractedText: pdf.extractedText,
      numberOfQuestions: options.numberOfQuestions,
      difficulty: options.difficulty.toLowerCase() as "easy" | "medium" | "hard",
      questionType: options.questionType,
      topicFocus: options.topicFocus,
      language: options.language,
      includeExplanations: options.includeExplanations,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    console.error("[Quiz Generation] AI error:", message);

    if (message.includes("validation failed")) {
      return apiError(
        "The AI returned an unexpected response format. Please try again.",
        502
      );
    }
    if (message.includes("API key") || message.includes("authentication")) {
      return apiError("AI service configuration error. Please contact support.", 500);
    }

    return apiError("Quiz generation failed. Please try again in a moment.", 502);
  }

  // ── Save quiz to database ─────────────────────────────────
  const quiz = await prisma.quiz.create({
    data: {
      userId,
      pdfDocumentId: pdf.id,
      title: options.title || aiQuiz.title,
      difficulty: options.difficulty,
      questionType: options.questionType,
      language: options.language,
      totalQuestions: aiQuiz.questions.length,
      questions: {
        create: aiQuiz.questions.map((q, idx) => ({
          type: q.type,
          questionText: q.question,
          options: q.options ? (q.options as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation ?? null,
          order: idx,
        })),
      },
    },
    include: {
      questions: {
        orderBy: { order: "asc" },
      },
    },
  });

  // ── Update usage count ────────────────────────────────────
  await incrementQuizUsage(userId);

  return apiSuccess({ quiz }, 201);
}
