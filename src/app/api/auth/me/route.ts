import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { getUserUsageSummary } from "@/lib/usage";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      subscriptionStatus: true,
      stripeCustomerId: true,
      subscriptionEndsAt: true,
      createdAt: true,
      _count: {
        select: { pdfs: true, quizzes: true, attempts: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { success: false, error: "User not found" },
      { status: 404 }
    );
  }

  const usage = await getUserUsageSummary(user.id, user.subscriptionStatus);

  return NextResponse.json({
    success: true,
    data: { user, usage },
  });
}
