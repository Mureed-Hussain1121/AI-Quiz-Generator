import { NextRequest } from "next/server";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { quizAttemptSchema } from "@/lib/validations/quiz";
import type { AttemptResult } from "@/types/quiz";
import { Prisma } from "@prisma/client";

// ── POST /api/quiz/:id/attempt — Submit quiz answers ─────────

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const userId = session!.user.id;

  // Fetch quiz with questions
  const quiz = await prisma.quiz.findUnique({
    where: { id: params.id },
    include: {
      questions: { orderBy: { order: "asc" } },
    },
  });

  if (!quiz) return apiError("Quiz not found", 404);

  // Users can attempt their own quizzes or public quizzes
  if (quiz.userId !== userId && !quiz.isPublic) {
    return apiError("You do not have permission to attempt this quiz", 403);
  }

  // Parse request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = quizAttemptSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 400);
  }

  const { answers, timeTaken } = parsed.data;

  // Build a map of questionId -> correct answer
  const questionMap = new Map(
    quiz.questions.map((q) => [q.id, q])
  );

  // Grade each answer
  const gradedAnswers: AttemptResult[] = [];
  let correctCount = 0;

  for (const submitted of answers) {
    const question = questionMap.get(submitted.questionId);

    if (!question) {
      // Skip unknown question IDs (don't error — quiz may have been edited)
      continue;
    }

    const isCorrect = gradeAnswer(
      submitted.userAnswer,
      question.correctAnswer,
      question.type
    );

    if (isCorrect) correctCount++;

    gradedAnswers.push({
      questionId: submitted.questionId,
      userAnswer: submitted.userAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      explanation: question.explanation,
    });
  }

  const totalQuestions = quiz.questions.length;
  const percentage = totalQuestions > 0
    ? Math.round((correctCount / totalQuestions) * 100)
    : 0;

  // Save attempt to database
  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      quizId: quiz.id,
      score: correctCount,
      totalQuestions,
      percentage,
      answers: gradedAnswers as unknown as Prisma.InputJsonValue,
      timeTaken: timeTaken ?? null,
    },
  });

  return apiSuccess(
    {
      attempt: {
        id: attempt.id,
        score: correctCount,
        totalQuestions,
        percentage,
        timeTaken,
        completedAt: attempt.completedAt,
      },
      results: gradedAnswers,
      message: getScoreMessage(percentage),
    },
    201
  );
}

// ── GET /api/quiz/:id/attempts — List attempt history ────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  // Verify quiz exists and user has access
  const quiz = await prisma.quiz.findUnique({
    where: { id: params.id },
    select: { userId: true, isPublic: true, title: true },
  });

  if (!quiz) return apiError("Quiz not found", 404);

  const userId = session!.user.id;
  if (quiz.userId !== userId && !quiz.isPublic) {
    return apiError("Access denied", 403);
  }

  // Users see only their own attempts
  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId: params.id, userId },
    select: {
      id: true,
      score: true,
      totalQuestions: true,
      percentage: true,
      timeTaken: true,
      completedAt: true,
    },
    orderBy: { completedAt: "desc" },
    take: 20, // Last 20 attempts
  });

  const bestScore = attempts.length > 0
    ? Math.max(...attempts.map((a) => a.percentage))
    : 0;

  return apiSuccess({ attempts, bestScore, quizTitle: quiz.title });
}

// ── Helper: Grade a single answer ────────────────────────────

function gradeAnswer(
  userAnswer: string,
  correctAnswer: string,
  questionType: string
): boolean {
  if (questionType === "short_answer") {
    // For short answers, do a lenient fuzzy match
    const normalize = (s: string) =>
      s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "");
    return normalize(userAnswer) === normalize(correctAnswer);
  }

  // For MCQ and true/false, exact case-insensitive match
  return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
}

function getScoreMessage(percentage: number): string {
  if (percentage === 100) return "Perfect score! Outstanding! 🎉";
  if (percentage >= 80) return "Excellent work! Well done! 🌟";
  if (percentage >= 60) return "Good job! Keep practicing! 👍";
  if (percentage >= 40) return "Not bad! Review the material and try again. 📚";
  return "Keep studying! You'll get there! 💪";
}
