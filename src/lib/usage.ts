import { prisma } from "@/lib/prisma";
import type { SubscriptionStatus } from "@prisma/client";
import {
  FREE_PLAN_LIMITS,
  PREMIUM_PLAN_LIMITS,
  type PlanLimits,
} from "@/types/quiz";

// ── Get current month key ─────────────────────────────────────

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ── Get or create usage record for the current month ─────────

export async function getOrCreateUsage(userId: string) {
  const month = getCurrentMonth();

  return await prisma.usageLimit.upsert({
    where: { userId_month: { userId, month } },
    create: { userId, month, pdfUploadsUsed: 0, quizzesGeneratedUsed: 0 },
    update: {},
  });
}

// ── Get plan limits for a user ────────────────────────────────

export function getPlanLimits(subscriptionStatus: SubscriptionStatus): PlanLimits {
  return subscriptionStatus === "PREMIUM"
    ? PREMIUM_PLAN_LIMITS
    : FREE_PLAN_LIMITS;
}

// ── Check if user can upload a PDF ───────────────────────────

export async function canUploadPDF(
  userId: string,
  subscriptionStatus: SubscriptionStatus
): Promise<{ allowed: boolean; reason?: string }> {
  const limits = getPlanLimits(subscriptionStatus);
  const usage = await getOrCreateUsage(userId);

  if (usage.pdfUploadsUsed >= limits.pdfUploadsPerMonth) {
    return {
      allowed: false,
      reason: `You've reached your monthly PDF upload limit (${limits.pdfUploadsPerMonth}). ${
        subscriptionStatus === "FREE" ? "Upgrade to Premium for more uploads." : "Limit resets next month."
      }`,
    };
  }

  return { allowed: true };
}

// ── Check if user can generate a quiz ────────────────────────

export async function canGenerateQuiz(
  userId: string,
  subscriptionStatus: SubscriptionStatus,
  requestedQuestions: number
): Promise<{ allowed: boolean; reason?: string }> {
  const limits = getPlanLimits(subscriptionStatus);
  const usage = await getOrCreateUsage(userId);

  // Check monthly generation limit
  if (usage.quizzesGeneratedUsed >= limits.quizGenerationsPerMonth) {
    return {
      allowed: false,
      reason: `You've reached your monthly quiz generation limit (${limits.quizGenerationsPerMonth}). ${
        subscriptionStatus === "FREE" ? "Upgrade to Premium for more quizzes." : "Limit resets next month."
      }`,
    };
  }

  // Check question count limit
  if (requestedQuestions > limits.maxQuestionsPerQuiz) {
    return {
      allowed: false,
      reason: `Your plan allows a maximum of ${limits.maxQuestionsPerQuiz} questions per quiz. ${
        subscriptionStatus === "FREE" ? "Upgrade to Premium for up to 100 questions." : ""
      }`,
    };
  }

  return { allowed: true };
}

// ── Check premium feature access ─────────────────────────────

export function checkPremiumFeature(
  subscriptionStatus: SubscriptionStatus,
  feature: keyof PlanLimits
): { allowed: boolean; reason?: string } {
  const limits = getPlanLimits(subscriptionStatus);

  if (!limits[feature]) {
    return {
      allowed: false,
      reason: "This feature is available on the Premium plan. Upgrade to access it.",
    };
  }

  return { allowed: true };
}

// ── Increment usage counters ──────────────────────────────────

export async function incrementPDFUsage(userId: string): Promise<void> {
  const month = getCurrentMonth();
  await prisma.usageLimit.upsert({
    where: { userId_month: { userId, month } },
    create: { userId, month, pdfUploadsUsed: 1, quizzesGeneratedUsed: 0 },
    update: { pdfUploadsUsed: { increment: 1 } },
  });
}

export async function incrementQuizUsage(userId: string): Promise<void> {
  const month = getCurrentMonth();
  await prisma.usageLimit.upsert({
    where: { userId_month: { userId, month } },
    create: { userId, month, pdfUploadsUsed: 0, quizzesGeneratedUsed: 1 },
    update: { quizzesGeneratedUsed: { increment: 1 } },
  });
}

// ── Get full usage summary for dashboard ─────────────────────

export async function getUserUsageSummary(
  userId: string,
  subscriptionStatus: SubscriptionStatus
) {
  const usage = await getOrCreateUsage(userId);
  const limits = getPlanLimits(subscriptionStatus);

  return {
    pdfUploads: {
      used: usage.pdfUploadsUsed,
      limit: limits.pdfUploadsPerMonth,
      remaining: Math.max(0, limits.pdfUploadsPerMonth - usage.pdfUploadsUsed),
    },
    quizGenerations: {
      used: usage.quizzesGeneratedUsed,
      limit: limits.quizGenerationsPerMonth,
      remaining: Math.max(
        0,
        limits.quizGenerationsPerMonth - usage.quizzesGeneratedUsed
      ),
    },
    maxQuestionsPerQuiz: limits.maxQuestionsPerQuiz,
    features: {
      canExportPDF: limits.canExportPDF,
      canShareQuiz: limits.canShareQuiz,
      canUseMixedTypes: limits.canUseMixedTypes,
      canUseExplanations: limits.canUseExplanations,
    },
  };
}
