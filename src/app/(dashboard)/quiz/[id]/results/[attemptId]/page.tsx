import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/primitives";
import {
  Trophy, CheckCircle, XCircle, ArrowLeft,
  RotateCcw, Lightbulb, Clock, BarChart3,
} from "lucide-react";
import { cn, formatTime, getScoreColor } from "@/lib/utils";

export const metadata = { title: "Quiz Results" };

interface AttemptAnswer {
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string | null;
}

export default async function ResultsPage({
  params,
}: {
  params: { id: string; attemptId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: params.attemptId },
    include: {
      quiz: {
        include: {
          questions: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!attempt) notFound();

  // Users can only view their own attempt results
  if (attempt.userId !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/quiz");
  }

  const results = attempt.answers as unknown as AttemptAnswer[];
  const questionMap = new Map(attempt.quiz.questions.map((q) => [q.id, q]));
  const { score, totalQuestions, percentage, timeTaken } = attempt;

  // Determine score tier
  const tier =
    percentage >= 80 ? "excellent" : percentage >= 60 ? "good" : percentage >= 40 ? "fair" : "poor";

  const tierConfig = {
    excellent: { color: "text-green-600", bg: "bg-green-50", border: "border-green-200", emoji: "🎉", label: "Excellent!" },
    good: { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", emoji: "👍", label: "Good Job!" },
    fair: { color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200", emoji: "📚", label: "Keep Studying!" },
    poor: { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", emoji: "💪", label: "Don't Give Up!" },
  }[tier];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <Link
        href={`/quiz/${params.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Quiz
      </Link>

      {/* ── Score Banner ─────────────────────────────────── */}
      <Card className={cn("border-2", tierConfig.border, tierConfig.bg)}>
        <CardContent className="py-8 text-center">
          <div className="text-5xl mb-3">{tierConfig.emoji}</div>
          <h1 className={cn("text-3xl font-extrabold mb-1", tierConfig.color)}>
            {percentage}%
          </h1>
          <p className={cn("text-lg font-semibold mb-1", tierConfig.color)}>
            {tierConfig.label}
          </p>
          <p className="text-muted-foreground text-sm mb-6">
            You answered <strong>{score}</strong> out of <strong>{totalQuestions}</strong> questions correctly.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="font-medium text-green-700">{score} correct</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="font-medium text-red-700">{totalQuestions - score} incorrect</span>
            </div>
            {timeTaken && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-blue-700">{formatTime(timeTaken)}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="gradient">
              <Link href={`/quiz/${params.id}/attempt`}>
                <RotateCcw className="mr-2 h-4 w-4" /> Retry Quiz
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/quiz/${params.id}`}>
                <BarChart3 className="mr-2 h-4 w-4" /> View All Attempts
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/quiz">Back to Quizzes</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Question Review ───────────────────────────────── */}
      <div>
        <h2 className="font-semibold text-lg mb-4">Question Review</h2>
        <div className="space-y-4">
          {attempt.quiz.questions.map((question, idx) => {
            const result = results.find((r) => r.questionId === question.id);
            const isCorrect = result?.isCorrect ?? false;
            const userAnswer = result?.userAnswer ?? "";
            const options = question.options as string[] | null;

            return (
              <Card
                key={question.id}
                className={cn(
                  "border-l-4",
                  isCorrect ? "border-l-green-500" : "border-l-red-500"
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5",
                      isCorrect ? "bg-green-100" : "bg-red-100"
                    )}>
                      {isCorrect
                        ? <CheckCircle className="h-4 w-4 text-green-600" />
                        : <XCircle className="h-4 w-4 text-red-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          Q{idx + 1} · {question.type.replace("_", " ")}
                        </span>
                        <Badge variant={isCorrect ? "success" : "destructive"} className="text-[10px] py-0">
                          {isCorrect ? "Correct" : "Incorrect"}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{question.questionText}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-3">
                  {/* Options for MCQ/True-False */}
                  {options && options.length > 0 && (
                    <div className="space-y-1.5 ml-9">
                      {options.map((opt, i) => {
                        const isUserAnswer = opt === userAnswer;
                        const isCorrectAnswer = opt === question.correctAnswer;
                        return (
                          <div
                            key={i}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded text-xs",
                              isCorrectAnswer
                                ? "bg-green-100 text-green-800 font-medium"
                                : isUserAnswer && !isCorrect
                                ? "bg-red-100 text-red-800"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            <span className="font-semibold w-4">
                              {question.type === "true_false" ? "" : ["A", "B", "C", "D"][i] + "."}
                            </span>
                            {opt}
                            {isCorrectAnswer && (
                              <CheckCircle className="ml-auto h-3.5 w-3.5 text-green-600" />
                            )}
                            {isUserAnswer && !isCorrectAnswer && (
                              <XCircle className="ml-auto h-3.5 w-3.5 text-red-600" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Short answer comparison */}
                  {question.type === "short_answer" && (
                    <div className="ml-9 space-y-1.5">
                      {userAnswer && (
                        <div className={cn(
                          "px-3 py-2 rounded text-xs",
                          isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        )}>
                          <span className="font-medium">Your answer: </span>{userAnswer}
                        </div>
                      )}
                      {!isCorrect && (
                        <div className="bg-green-100 text-green-800 px-3 py-2 rounded text-xs">
                          <span className="font-medium">Correct answer: </span>
                          {question.correctAnswer}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explanation */}
                  {question.explanation && (
                    <div className="ml-9 flex gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <Lightbulb className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-800">{question.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
