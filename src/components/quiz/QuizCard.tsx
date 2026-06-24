"use client";

import Link from "next/link";
import { formatDate, getDifficultyColor, capitalize } from "@/lib/utils";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Clock,
  BookOpen,
  Play,
  Trash2,
  Globe,
  Lock,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizCardProps {
  quiz: {
    id: string;
    title: string;
    difficulty: string;
    questionType: string;
    totalQuestions: number;
    isPublic: boolean;
    createdAt: string | Date;
    _count?: { attempts: number };
    pdfDocument?: { originalName: string } | null;
  };
  onDelete?: (id: string) => void;
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  MCQ: "Multiple Choice",
  TRUE_FALSE: "True / False",
  SHORT_ANSWER: "Short Answer",
  MIXED: "Mixed",
};

export function QuizCard({ quiz, onDelete }: QuizCardProps) {
  return (
    <Card className="group flex flex-col hover:shadow-md transition-shadow duration-200">
      <CardContent className="flex-1 pt-5 pb-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100">
            <Brain className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex gap-1.5 flex-wrap justify-end">
            <Badge
              className={cn(
                "text-[11px] border",
                getDifficultyColor(quiz.difficulty)
              )}
              variant="outline"
            >
              {capitalize(quiz.difficulty)}
            </Badge>
            <Badge variant="secondary" className="text-[11px]">
              {QUESTION_TYPE_LABELS[quiz.questionType] ?? quiz.questionType}
            </Badge>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-2">
          {quiz.title}
        </h3>

        {/* Source PDF */}
        {quiz.pdfDocument && (
          <p className="text-xs text-muted-foreground truncate mb-3">
            📄 {quiz.pdfDocument.originalName}
          </p>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {quiz.totalQuestions} questions
          </span>
          <span className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            {quiz._count?.attempts ?? 0} attempts
          </span>
          <span className="flex items-center gap-1">
            {quiz.isPublic ? (
              <><Globe className="h-3 w-3" /> Public</>
            ) : (
              <><Lock className="h-3 w-3" /> Private</>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatDate(quiz.createdAt)}
        </div>
      </CardContent>

      <CardFooter className="pt-0 gap-2">
        <Button asChild size="sm" variant="gradient" className="flex-1">
          <Link href={`/quiz/${quiz.id}/attempt`}>
            <Play className="mr-1.5 h-3.5 w-3.5" />
            Attempt
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={`/quiz/${quiz.id}`}>View</Link>
        </Button>
        {onDelete && (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 px-2"
            onClick={() => onDelete(quiz.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
