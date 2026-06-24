"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ChevronLeft, ChevronRight, Clock, CheckCircle,
  Circle, AlertCircle, Brain, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/primitives";
import { toast } from "@/hooks/use-toast";
import { cn, formatTime } from "@/lib/utils";

interface Question {
  id: string;
  type: string;
  questionText: string;
  options: string[] | null;
  order: number;
}

interface QuizData {
  id: string;
  title: string;
  difficulty: string;
  questionType: string;
  totalQuestions: number;
  questions: Question[];
}

export default function AttemptQuizPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // ── Load quiz ────────────────────────────────────────────

  useEffect(() => {
    async function loadQuiz() {
      const res = await fetch(`/api/quiz/${params.id}`);
      const json = await res.json();

      if (!json.success) {
        toast.error("Failed to load quiz", json.error);
        router.push("/quiz");
        return;
      }

      // For attempt mode, we get questions without correct answers
      setQuiz(json.data);
      setIsLoading(false);
      setTimerActive(true);
    }
    loadQuiz();
  }, [params.id, router]);

  // ── Timer ────────────────────────────────────────────────

  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  // ── Answer handling ──────────────────────────────────────

  function setAnswer(questionId: string, answer: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }

  const currentQuestion = quiz?.questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = quiz ? (answeredCount / quiz.questions.length) * 100 : 0;
  const allAnswered = quiz ? answeredCount === quiz.questions.length : false;

  // ── Submit ────────────────────────────────────────────────

  async function handleSubmit() {
    if (!quiz) return;

    const unanswered = quiz.questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      const ok = confirm(
        `You have ${unanswered.length} unanswered question(s). Submit anyway?`
      );
      if (!ok) return;
    }

    setIsSubmitting(true);
    setTimerActive(false);

    const payload = {
      answers: quiz.questions.map((q) => ({
        questionId: q.id,
        userAnswer: answers[q.id] ?? "",
      })),
      timeTaken: elapsed,
    };

    try {
      const res = await fetch(`/api/quiz/${params.id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!json.success) {
        toast.error("Submission failed", json.error);
        setIsSubmitting(false);
        setTimerActive(true);
        return;
      }

      router.push(`/quiz/${params.id}/results/${json.data.attempt.id}`);
    } catch {
      toast.error("Submission failed", "Please try again.");
      setIsSubmitting(false);
      setTimerActive(true);
    }
  }

  // ── Loading state ─────────────────────────────────────────

  if (isLoading || !quiz || !currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-24 gap-4">
        <Brain className="h-12 w-12 text-purple-600 animate-pulse" />
        <p className="text-muted-foreground">Loading quiz...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg line-clamp-1">{quiz.title}</h1>
          <p className="text-sm text-muted-foreground">
            Question {currentIndex + 1} of {quiz.questions.length}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-mono bg-muted rounded-lg px-3 py-1.5">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {formatTime(elapsed)}
        </div>
      </div>

      {/* ── Progress ─────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{answeredCount} answered</span>
          <span>{quiz.questions.length - answeredCount} remaining</span>
        </div>
      </div>

      {/* ── Question Card ─────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span className="capitalize bg-muted px-2 py-0.5 rounded">
              {currentQuestion.type.replace("_", " ")}
            </span>
          </div>
          <CardTitle className="text-base font-medium leading-relaxed">
            {currentIndex + 1}. {currentQuestion.questionText}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-2.5">
          {/* ── MCQ / True-False Options ─────────────────── */}
          {(currentQuestion.type === "mcq" || currentQuestion.type === "true_false") &&
            currentQuestion.options?.map((option, idx) => {
              const isSelected = answers[currentQuestion.id] === option;
              return (
                <button
                  key={idx}
                  type="button"
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg border p-3.5 text-left text-sm transition-all",
                    isSelected
                      ? "border-purple-500 bg-purple-50 text-purple-900 shadow-sm"
                      : "hover:border-gray-300 hover:bg-muted/50"
                  )}
                  onClick={() => setAnswer(currentQuestion.id, option)}
                >
                  <div className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isSelected ? "border-purple-500 bg-purple-500" : "border-muted-foreground"
                  )}>
                    {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                  <span className={cn("font-medium w-5 text-xs shrink-0", isSelected ? "text-purple-700" : "text-muted-foreground")}>
                    {currentQuestion.type === "true_false"
                      ? ""
                      : ["A", "B", "C", "D"][idx]}
                  </span>
                  {option}
                </button>
              );
            })}

          {/* ── Short Answer ─────────────────────────────── */}
          {currentQuestion.type === "short_answer" && (
            <div className="space-y-2">
              <textarea
                placeholder="Type your answer here..."
                className="w-full min-h-[120px] rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={answers[currentQuestion.id] ?? ""}
                onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Write a concise answer — it will be compared to the model answer.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Navigation ───────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>

        {/* Question dots (show up to 10) */}
        <div className="flex-1 flex items-center justify-center gap-1.5 flex-wrap">
          {quiz.questions.slice(0, 15).map((q, idx) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "h-6 w-6 rounded-full text-xs font-medium transition-all",
                idx === currentIndex
                  ? "bg-purple-600 text-white scale-110"
                  : answers[q.id]
                  ? "bg-purple-200 text-purple-800"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {idx + 1}
            </button>
          ))}
          {quiz.questions.length > 15 && (
            <span className="text-xs text-muted-foreground">+{quiz.questions.length - 15}</span>
          )}
        </div>

        {currentIndex < quiz.questions.length - 1 ? (
          <Button
            variant={answers[currentQuestion.id] ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentIndex((i) => i + 1)}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            variant="gradient"
            size="sm"
            onClick={handleSubmit}
            loading={isSubmitting}
          >
            <Send className="h-4 w-4 mr-1.5" /> Submit
          </Button>
        )}
      </div>

      {/* ── Submit button (bottom, always visible) ────────── */}
      <div className="border-t pt-4">
        <Button
          variant="gradient"
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={answeredCount === 0}
        >
          <Send className="mr-2 h-5 w-5" />
          Submit Quiz ({answeredCount}/{quiz.questions.length} answered)
        </Button>
        {!allAnswered && (
          <p className="text-xs text-center text-muted-foreground mt-2 flex items-center justify-center gap-1">
            <AlertCircle className="h-3 w-3" />
            You can submit with unanswered questions — they&apos;ll be marked wrong.
          </p>
        )}
      </div>
    </div>
  );
}
