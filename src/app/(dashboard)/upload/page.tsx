"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  Loader2,
  Brain,
  Settings,
  ChevronRight,
  AlertCircle,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/primitives";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/interactive";
import { toast } from "@/hooks/use-toast";
import { quizGenerationSchema, type QuizGenerationInput } from "@/lib/validations/quiz";
import { formatBytes, cn } from "@/lib/utils";
import { MAX_FILE_SIZE_MB } from "@/lib/validations/pdf";

type Step = "upload" | "configure" | "generating" | "done";

interface UploadedPDF {
  id: string;
  originalName: string;
  fileSize: number;
  wordCount: number;
  pageCount: number;
  preview: string;
}

export default function UploadPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPDF, setUploadedPDF] = useState<UploadedPDF | null>(null);
  const [generatedQuizId, setGeneratedQuizId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPremium = session?.user?.subscriptionStatus === "PREMIUM";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<QuizGenerationInput>({
    resolver: zodResolver(quizGenerationSchema),
    defaultValues: {
      numberOfQuestions: 10,
      difficulty: "MEDIUM",
      questionType: "MCQ",
      language: "English",
      includeExplanations: false,
    },
  });

  // ── File handling ─────────────────────────────────────────

  async function handleFile(file: File) {
    if (file.type !== "application/pdf") {
      toast.error("Invalid file type", "Please upload a PDF file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error("File too large", `Maximum file size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (!json.success) {
        toast.error("Upload failed", json.error);
        return;
      }

      setUploadedPDF({
        id: json.data.pdf.id,
        originalName: json.data.pdf.originalName,
        fileSize: json.data.pdf.fileSize,
        wordCount: json.data.wordCount,
        pageCount: json.data.pageCount,
        preview: json.data.preview,
      });

      setValue("pdfDocumentId", json.data.pdf.id);
      setStep("configure");
      toast.success("PDF uploaded!", "Now configure your quiz.");
    } catch {
      toast.error("Upload failed", "An unexpected error occurred.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  // ── Quiz generation ───────────────────────────────────────

  async function onGenerateQuiz(data: QuizGenerationInput) {
    setStep("generating");

    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!json.success) {
        toast.error("Generation failed", json.error);
        setStep("configure");
        return;
      }

      setGeneratedQuizId(json.data.quiz.id);
      setStep("done");
      toast.success("Quiz generated!", `${json.data.quiz.totalQuestions} questions created.`);
    } catch {
      toast.error("Generation failed", "An unexpected error occurred.");
      setStep("configure");
    }
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Generate Quiz from PDF</h1>
        <p className="text-muted-foreground mt-1">
          Upload a PDF and let AI create a quiz for you in seconds.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm">
        {[
          { id: "upload", label: "Upload PDF" },
          { id: "configure", label: "Configure" },
          { id: "done", label: "Generate" },
        ].map((s, idx) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
              step === s.id || (step === "generating" && s.id === "configure") || (step === "done" && idx < 2)
                ? "bg-purple-600 text-white"
                : "bg-muted text-muted-foreground"
            )}>
              {idx + 1}
            </div>
            <span className={step === s.id ? "font-medium" : "text-muted-foreground"}>{s.label}</span>
            {idx < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* ── STEP 1: Upload ────────────────────────────── */}
      {step === "upload" && (
        <Card>
          <CardContent className="pt-6">
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer",
                isDragging
                  ? "border-purple-500 bg-purple-50"
                  : "border-muted-foreground/25 hover:border-purple-400 hover:bg-muted/30"
              )}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
                  <p className="font-medium">Uploading and extracting text...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Drop your PDF here</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      or click to browse — Max {MAX_FILE_SIZE_MB}MB
                    </p>
                  </div>
                  <Button variant="outline" size="sm" type="button">
                    <FileText className="mr-2 h-4 w-4" /> Browse Files
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Only text-based PDFs are supported. Scanned/image PDFs won&apos;t work well. 
                Make sure your PDF contains selectable text.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── STEP 2: Configure ─────────────────────────── */}
      {(step === "configure" || step === "generating") && uploadedPDF && (
        <form onSubmit={handleSubmit(onGenerateQuiz)} className="space-y-4">
          {/* PDF Info */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{uploadedPDF.originalName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(uploadedPDF.fileSize)} · {uploadedPDF.pageCount} pages · {uploadedPDF.wordCount.toLocaleString()} words
                  </p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              </div>
            </CardContent>
          </Card>

          {/* Quiz Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" /> Quiz Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <Label>Quiz Title <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  placeholder="AI will auto-generate a title if left blank"
                  {...register("title")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Number of Questions */}
                <div className="space-y-1.5">
                  <Label>Number of Questions</Label>
                  <Input
                    type="number"
                    min={1}
                    max={isPremium ? 100 : 10}
                    {...register("numberOfQuestions", { valueAsNumber: true })}
                  />
                  {!isPremium && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Max 10 on Free plan
                    </p>
                  )}
                  {errors.numberOfQuestions && (
                    <p className="text-xs text-destructive">{errors.numberOfQuestions.message}</p>
                  )}
                </div>

                {/* Language */}
                <div className="space-y-1.5">
                  <Label>Language</Label>
                  <Input placeholder="English" {...register("language")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Difficulty */}
                <div className="space-y-1.5">
                  <Label>Difficulty</Label>
                  <Select onValueChange={(v) => setValue("difficulty", v as any)} defaultValue="MEDIUM">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EASY">Easy</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HARD">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Question Type */}
                <div className="space-y-1.5">
                  <Label>Question Type</Label>
                  <Select onValueChange={(v) => setValue("questionType", v as any)} defaultValue="MCQ">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MCQ">Multiple Choice (MCQ)</SelectItem>
                      <SelectItem value="TRUE_FALSE">True / False</SelectItem>
                      <SelectItem value="SHORT_ANSWER">Short Answer</SelectItem>
                      <SelectItem value="MIXED" disabled={!isPremium}>
                        Mixed {!isPremium && "🔒 Pro"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Topic Focus */}
              <div className="space-y-1.5">
                <Label>Topic Focus <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  placeholder="e.g., 'Chapter 3 - Photosynthesis' or leave blank for full coverage"
                  {...register("topicFocus")}
                />
              </div>

              {/* Explanations */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div>
                  <p className="text-sm font-medium">Include Explanations</p>
                  <p className="text-xs text-muted-foreground">
                    AI explains each correct answer {!isPremium && "(Premium feature)"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!isPremium && <Lock className="h-4 w-4 text-muted-foreground" />}
                  <input
                    type="checkbox"
                    disabled={!isPremium}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                    onChange={(e) => setValue("includeExplanations", e.target.checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            variant="gradient"
            size="lg"
            className="w-full"
            loading={isSubmitting || step === "generating"}
          >
            <Brain className="mr-2 h-5 w-5" />
            {step === "generating" ? "Generating your quiz..." : "Generate Quiz with AI"}
          </Button>
        </form>
      )}

      {/* ── STEP 3: Done ──────────────────────────────── */}
      {step === "done" && generatedQuizId && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-10 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-9 w-9 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-green-900">Quiz Generated!</h2>
            <p className="text-green-700 mb-6">Your quiz is ready. Start attempting it now!</p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="gradient"
                onClick={() => router.push(`/quiz/${generatedQuizId}/attempt`)}
              >
                Attempt Quiz
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/quiz/${generatedQuizId}`)}
              >
                View Details
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setStep("upload");
                  setUploadedPDF(null);
                  setGeneratedQuizId(null);
                }}
              >
                Generate Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
