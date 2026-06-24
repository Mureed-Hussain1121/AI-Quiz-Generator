import { NextRequest } from "next/server";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { quizUpdateSchema } from "@/lib/validations/quiz";
import { checkPremiumFeature } from "@/lib/usage";

// ── GET /api/quiz/:id ─────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.id },
    include: {
      questions: { orderBy: { order: "asc" } },
      pdfDocument: {
        select: { id: true, originalName: true },
      },
      _count: { select: { attempts: true } },
    },
  });

  if (!quiz) {
    return apiError("Quiz not found", 404);
  }

  const userId = session!.user.id;

  // Allow access to owner, admin, or public quizzes
  if (quiz.userId !== userId && !quiz.isPublic && session!.user.role !== "ADMIN") {
    return apiError("You do not have permission to view this quiz", 403);
  }

  // If not the owner, hide correct answers (for shared/public quizzes)
  const isOwner = quiz.userId === userId || session!.user.role === "ADMIN";
  const sanitizedQuestions = isOwner
    ? quiz.questions
    : quiz.questions.map((q) => ({
        ...q,
        correctAnswer: "", // Hide answer for non-owners in attempt mode
        explanation: null,
      }));

  return apiSuccess({ ...quiz, questions: sanitizedQuestions, isOwner });
}

// ── PATCH /api/quiz/:id ───────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });

  if (!quiz) return apiError("Quiz not found", 404);
  if (quiz.userId !== session!.user.id) {
    return apiError("You do not have permission to edit this quiz", 403);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = quizUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 400);
  }

  // Check if trying to make public (premium feature)
  if (parsed.data.isPublic === true) {
    const check = checkPremiumFeature(
      session!.user.subscriptionStatus,
      "canShareQuiz"
    );
    if (!check.allowed) return apiError(check.reason!, 403);
  }

  const updated = await prisma.quiz.update({
    where: { id: params.id },
    data: parsed.data,
    include: { questions: { orderBy: { order: "asc" } } },
  });

  return apiSuccess({ quiz: updated });
}

// ── DELETE /api/quiz/:id ──────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });

  if (!quiz) return apiError("Quiz not found", 404);
  if (quiz.userId !== session!.user.id && session!.user.role !== "ADMIN") {
    return apiError("You do not have permission to delete this quiz", 403);
  }

  await prisma.quiz.delete({ where: { id: params.id } });

  return apiSuccess({ message: "Quiz deleted successfully" });
}
