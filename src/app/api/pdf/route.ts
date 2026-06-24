import { NextRequest, NextResponse } from "next/server";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import {
  uploadPDFToStorage,
  getSignedURL,
} from "@/lib/storage/supabase";
import {
  extractTextFromPDF,
  isPDFBuffer,
  sanitizeFileName,
} from "@/lib/pdf/extract";
import {
  canUploadPDF,
  incrementPDFUsage,
} from "@/lib/usage";
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
} from "@/lib/validations/pdf";
import { checkRateLimit, PDF_UPLOAD_RATE_LIMIT } from "@/lib/rate-limit";
import { randomUUID } from "crypto";

// ── GET /api/pdf — List user's PDFs ──────────────────────────

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(20, parseInt(searchParams.get("limit") ?? "10"));
  const skip = (page - 1) * limit;

  const [pdfs, total] = await Promise.all([
    prisma.pDFDocument.findMany({
      where: { userId: session!.user.id },
      select: {
        id: true,
        originalName: true,
        fileSize: true,
        pageCount: true,
        wordCount: true,
        createdAt: true,
        _count: { select: { quizzes: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.pDFDocument.count({ where: { userId: session!.user.id } }),
  ]);

  return apiSuccess({ pdfs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

// ── POST /api/pdf — Upload a PDF ─────────────────────────────

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const userId = session!.user.id;
  const subscriptionStatus = session!.user.subscriptionStatus;

  // Rate limit per user
  const rateLimit = checkRateLimit(`pdf-upload:${userId}`, PDF_UPLOAD_RATE_LIMIT);
  if (!rateLimit.success) {
    return apiError("Too many upload requests. Please slow down.", 429);
  }

  // Check monthly usage limit
  const usageCheck = await canUploadPDF(userId, subscriptionStatus);
  if (!usageCheck.allowed) {
    return apiError(usageCheck.reason!, 403);
  }

  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return apiError("Invalid form data", 400);
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return apiError("No file provided. Please select a PDF file.", 400);
  }

  // Validate file type by MIME
  if (file.type !== "application/pdf") {
    return apiError("Only PDF files are allowed.", 400);
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return apiError(`File size must not exceed ${MAX_FILE_SIZE_MB}MB.`, 400);
  }

  if (file.size === 0) {
    return apiError("The uploaded file is empty.", 400);
  }

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Validate PDF magic bytes
  if (!isPDFBuffer(buffer)) {
    return apiError(
      "Invalid PDF file. The file does not appear to be a valid PDF.",
      400
    );
  }

  // Extract text from PDF
  let extraction;
  try {
    extraction = await extractTextFromPDF(buffer);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "PDF extraction failed";
    return apiError(message, 422);
  }

  // Build storage path: userId/uuid-sanitizedName.pdf
  const sanitizedName = sanitizeFileName(file.name);
  const uuid = randomUUID();
  const storagePath = `${userId}/${uuid}-${sanitizedName}.pdf`;

  // Upload to Supabase Storage
  try {
    await uploadPDFToStorage(buffer, storagePath);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Storage upload failed";
    console.error("[PDF Upload] Storage error:", message);
    return apiError("Failed to store the file. Please try again.", 500);
  }

  // Save metadata to database
  const pdfDoc = await prisma.pDFDocument.create({
    data: {
      userId,
      fileName: `${uuid}-${sanitizedName}.pdf`,
      originalName: file.name.slice(0, 255),
      fileSize: file.size,
      storagePath,
      extractedText: extraction.text,
      pageCount: extraction.pageCount,
      wordCount: extraction.wordCount,
    },
    select: {
      id: true,
      originalName: true,
      fileSize: true,
      pageCount: true,
      wordCount: true,
      createdAt: true,
    },
  });

  // Increment usage
  await incrementPDFUsage(userId);

  return apiSuccess(
    {
      pdf: pdfDoc,
      preview: extraction.text.slice(0, 500) + (extraction.text.length > 500 ? "..." : ""),
      wordCount: extraction.wordCount,
      pageCount: extraction.pageCount,
    },
    201
  );
}
