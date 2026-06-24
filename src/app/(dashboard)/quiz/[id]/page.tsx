import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/primitives";
import {
  Play, ArrowLeft, BookOpen, Calendar, Globe, Lock,
  BarChart3, ChevronRight,
} from "lucide-react";
import { formatDate, getDifficultyColor, capitalize, cn } from "@/lib/utils";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: params.id },
    select: { title: true },
  });
  return { title: quiz?.title ?? "Quiz" };
}

export default async function QuizDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.id },
    include: {
      questions: { orderBy: { order: "asc" } },
      pdfDocument: { select: { originalName: true } },
      _count: { select: { attempts: true } },
    },
  });

  if (!quiz) notFound();

  const isOwner = quiz.userId === session.user.id || session.user.role === "ADMIN";
  if (!isOwner && !quiz.isPublic) redirect("/quiz");

  // Get recent attempts for this user
  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId: params.id, userId: session.user.id },
    orderBy: { completedAt: "desc" },
    take: 5,
    select: { id: true, score: true, totalQuestions: true, percentage: true, completedAt: true },
  });

  const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.percentage)) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back link */}
      <Link href="/quiz" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Quizzes
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge className={cn("text-xs border", getDifficultyColor(quiz.difficulty))}>
              {capitalize(quiz.difficulty)}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {quiz.questionType.replace("_", " ")}
            </Badge>
            {quiz.isPublic ? (
              <Badge variant="success" className="text-xs flex items-center gap-1">
                <Globe className="h-3 w-3" /> Public
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Lock className="h-3 w-3" /> Private
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" /> {quiz.totalQuestions} questions
            </span>
            <span className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" /> {quiz._count.attempts} attempts
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> {formatDate(quiz.createdAt)}
            </span>
            {quiz.pdfDocument && (
              <span className="flex items-center gap-1.5">
                📄 {quiz.pdfDocument.originalName}
              </span>
            )}
          </div>
        </div>

        {isOwner && (
          <Button asChild variant="gradient" size="lg">
            <Link href={`/quiz/${params.id}/attempt`}>
              <Play className="mr-2 h-5 w-5" /> Start Quiz
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Questions preview */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-semibold">Questions Preview</h2>
          {quiz.questions.map((q, idx) => (
            <Card key={q.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="py-4">
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-2">{q.questionText}</p>
                    {q.options && Array.isArray(q.options) && (
                      <div className="space-y-1">
                        {(q.options as string[]).map((opt, i) => (
                          <div key={i} className={cn(
                            "flex items-center gap-2 text-xs px-2.5 py-1.5 rounded",
                            isOwner && opt === q.correctAnswer
                              ? "bg-green-50 text-green-700 font-medium"
                              : "bg-muted text-muted-foreground"
                          )}>
                            <span className="font-medium w-5">{["A", "B", "C", "D"][i]}.</span>
                            {opt}
                            {isOwner && opt === q.correctAnswer && (
                              <span className="ml-auto text-green-600 text-xs">✓ Correct</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {q.type === "short_answer" && isOwner && (
                      <div className="mt-2 text-xs bg-green-50 text-green-700 rounded px-2.5 py-1.5">
                        <span className="font-medium">Answer: </span>{q.correctAnswer}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sidebar: stats + attempts */}
        <div className="space-y-4">
          {bestScore !== null && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Your Best Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "text-4xl font-extrabold",
                  bestScore >= 80 ? "text-green-600" : bestScore >= 60 ? "text-yellow-600" : "text-red-600"
                )}>
                  {bestScore}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">from {attempts.length} attempt{attempts.length !== 1 ? "s" : ""}</p>
              </CardContent>
            </Card>
          )}

          {attempts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Recent Attempts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {attempts.map((attempt) => (
                  <Link
                    key={attempt.id}
                    href={`/quiz/${params.id}/results/${attempt.id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted transition-colors text-sm"
                  >
                    <div>
                      <div className={cn(
                        "font-semibold",
                        attempt.percentage >= 80 ? "text-green-600" : attempt.percentage >= 60 ? "text-yellow-600" : "text-red-600"
                      )}>
                        {attempt.percentage}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {attempt.score}/{attempt.totalQuestions} · {formatDate(attempt.completedAt)}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          <Button asChild variant="gradient" className="w-full">
            <Link href={`/quiz/${params.id}/attempt`}>
              <Play className="mr-2 h-4 w-4" /> Attempt Quiz
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
