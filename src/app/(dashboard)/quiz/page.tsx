"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import { Card, CardContent } from "@/components/ui/card";
import { QuizCard } from "@/components/quiz/QuizCard";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/interactive";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/interactive";
import { toast } from "@/hooks/use-toast";

interface Quiz {
  id: string;
  title: string;
  difficulty: string;
  questionType: string;
  totalQuestions: number;
  isPublic: boolean;
  createdAt: string;
  _count: { attempts: number };
  pdfDocument?: { originalName: string } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function QuizListPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [questionType, setQuestionType] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchQuizzes = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "12" });
    if (search) params.set("search", search);
    if (difficulty !== "all") params.set("difficulty", difficulty);
    if (questionType !== "all") params.set("type", questionType);

    const res = await fetch(`/api/quiz?${params}`);
    const json = await res.json();
    if (json.success) {
      setQuizzes(json.data.quizzes);
      setPagination(json.data.pagination);
    }
    setIsLoading(false);
  }, [page, search, difficulty, questionType]);

  useEffect(() => {
    const t = setTimeout(fetchQuizzes, 300);
    return () => clearTimeout(t);
  }, [fetchQuizzes]);

  async function handleDelete(id: string) {
    setIsDeleting(true);
    const res = await fetch(`/api/quiz/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      toast.success("Quiz deleted");
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
    } else {
      toast.error("Delete failed", json.error);
    }
    setIsDeleting(false);
    setDeleteId(null);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">My Quizzes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pagination ? `${pagination.total} quizzes total` : "Loading..."}
          </p>
        </div>
        <Button variant="gradient" onClick={() => router.push("/upload")}>
          + New Quiz
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quizzes..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={difficulty} onValueChange={(v) => { setDifficulty(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="EASY">Easy</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HARD">Hard</SelectItem>
          </SelectContent>
        </Select>
        <Select value={questionType} onValueChange={(v) => { setQuestionType(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="MCQ">MCQ</SelectItem>
            <SelectItem value="TRUE_FALSE">True/False</SelectItem>
            <SelectItem value="SHORT_ANSWER">Short Answer</SelectItem>
            <SelectItem value="MIXED">Mixed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quiz Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : quizzes.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onDelete={(id) => setDeleteId(id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center text-sm text-muted-foreground px-3">
                Page {page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Brain className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="font-medium mb-2">
              {search || difficulty !== "all" || questionType !== "all"
                ? "No quizzes match your filters"
                : "No quizzes yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a PDF to generate your first quiz.
            </p>
            <Button variant="gradient" onClick={() => router.push("/upload")}>
              Create First Quiz
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quiz?</DialogTitle>
            <DialogDescription>
              This will permanently delete the quiz and all its attempt history.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={isDeleting}
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Delete Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
