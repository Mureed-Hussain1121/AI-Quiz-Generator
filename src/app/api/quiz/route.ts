import { NextRequest } from "next/server";
import { requireAuth, apiSuccess } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import type { Difficulty, QuestionType } from "@prisma/client";

// ── GET /api/quiz — List quizzes with search + filters ───────

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(20, parseInt(searchParams.get("limit") ?? "10"));
  const search = searchParams.get("search") ?? "";
  const difficulty = searchParams.get("difficulty") as Difficulty | null;
  const questionType = searchParams.get("type") as QuestionType | null;
  const skip = (page - 1) * limit;

  // Build where clause
  const where = {
    userId: session!.user.id,
    ...(search && {
      title: { contains: search, mode: "insensitive" as const },
    }),
    ...(difficulty && { difficulty }),
    ...(questionType && { questionType }),
  };

  const [quizzes, total] = await Promise.all([
    prisma.quiz.findMany({
      where,
      select: {
        id: true,
        title: true,
        difficulty: true,
        questionType: true,
        language: true,
        isPublic: true,
        totalQuestions: true,
        createdAt: true,
        updatedAt: true,
        pdfDocument: {
          select: { id: true, originalName: true },
        },
        _count: {
          select: { attempts: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.quiz.count({ where }),
  ]);

  return apiSuccess({
    quizzes,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
