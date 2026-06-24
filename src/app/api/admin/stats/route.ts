import { NextRequest } from "next/server";
import { requireAdmin, apiSuccess, apiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

// ── GET /api/admin/stats ──────────────────────────────────────

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [
    totalUsers,
    premiumUsers,
    totalQuizzes,
    totalPDFs,
    totalAttempts,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { subscriptionStatus: "PREMIUM" } }),
    prisma.quiz.count(),
    prisma.pDFDocument.count(),
    prisma.quizAttempt.count(),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionStatus: true,
        createdAt: true,
      },
    }),
  ]);

  return apiSuccess({
    stats: {
      totalUsers,
      premiumUsers,
      freeUsers: totalUsers - premiumUsers,
      totalQuizzes,
      totalPDFs,
      totalAttempts,
      conversionRate:
        totalUsers > 0
          ? Math.round((premiumUsers / totalUsers) * 100)
          : 0,
    },
    recentUsers,
  });
}
