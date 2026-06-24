import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserUsageSummary } from "@/lib/usage";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/primitives";
import { UsageCard } from "@/components/dashboard/UsageCard";
import { QuizCard } from "@/components/quiz/QuizCard";
import {
  Upload,
  Plus,
  BookOpen,
  FileText,
  Trophy,
  ArrowRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // Parallel data fetching for performance
  const [user, recentQuizzes, stats, usage] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        subscriptionStatus: true,
        createdAt: true,
        _count: { select: { pdfs: true, quizzes: true, attempts: true } },
      },
    }),
    prisma.quiz.findMany({
      where: { userId },
      include: {
        pdfDocument: { select: { originalName: true } },
        _count: { select: { attempts: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.quizAttempt.aggregate({
      where: { userId },
      _avg: { percentage: true },
      _count: true,
    }),
    getUserUsageSummary(userId, session.user.subscriptionStatus),
  ]);

  if (!user) redirect("/login");

  const isPremium = user.subscriptionStatus === "PREMIUM";
  const avgScore = stats._avg.percentage
    ? Math.round(stats._avg.percentage)
    : null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Welcome Header ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Welcome back, {user.name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {isPremium ? (
              <span className="flex items-center gap-1.5">
                <Badge variant="premium">PRO</Badge> You&apos;re on the Premium plan
              </span>
            ) : (
              "You're on the Free plan — upgrade for more features"
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/upload">
              <Upload className="mr-2 h-4 w-4" /> Upload PDF
            </Link>
          </Button>
          <Button asChild variant="gradient" size="sm">
            <Link href="/upload">
              <Plus className="mr-2 h-4 w-4" /> New Quiz
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Stats Row ────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total PDFs",
            value: user._count.pdfs,
            icon: FileText,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Quizzes Created",
            value: user._count.quizzes,
            icon: BookOpen,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Quiz Attempts",
            value: stats._count,
            icon: Trophy,
            color: "text-yellow-600",
            bg: "bg-yellow-50",
          },
          {
            label: "Avg. Score",
            value: avgScore ? `${avgScore}%` : "—",
            icon: Trophy,
            color: "text-green-600",
            bg: "bg-green-50",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-5 pb-4">
              <div className={`h-9 w-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main Content Grid ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Quizzes (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Quizzes</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/quiz">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {recentQuizzes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentQuizzes.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={{
                    ...quiz,
                    createdAt: quiz.createdAt.toISOString(),
                  }}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                <h3 className="font-medium mb-2">No quizzes yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a PDF and generate your first quiz to get started.
                </p>
                <Button asChild variant="gradient">
                  <Link href="/upload">
                    <Plus className="mr-2 h-4 w-4" /> Create First Quiz
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Usage card (1/3 width) */}
        <div className="space-y-4">
          <UsageCard
            usage={usage}
            subscriptionStatus={user.subscriptionStatus}
          />

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start" size="sm">
                <Link href="/upload">
                  <Upload className="mr-2 h-4 w-4 text-purple-600" /> Upload New PDF
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start" size="sm">
                <Link href="/quiz">
                  <BookOpen className="mr-2 h-4 w-4 text-blue-600" /> Browse All Quizzes
                </Link>
              </Button>
              {!isPremium && (
                <Button asChild variant="gradient" className="w-full justify-start" size="sm">
                  <Link href="/pricing">
                    ✨ Upgrade to Pro
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
