import { NextRequest } from "next/server";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { deletePDFFromStorage, getSignedURL } from "@/lib/storage/supabase";

// ── GET /api/pdf/:id ──────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const pdf = await prisma.pDFDocument.findUnique({
    where: { id: params.id },
    include: {
      quizzes: {
        select: {
          id: true,
          title: true,
          difficulty: true,
          questionType: true,
          totalQuestions: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!pdf) {
    return apiError("PDF not found", 404);
  }

  // Ownership check — users can only access their own PDFs
  if (pdf.userId !== session!.user.id && session!.user.role !== "ADMIN") {
    return apiError("You do not have permission to access this PDF", 403);
  }

  // Generate a signed URL for download (1 hour)
  let signedUrl: string | undefined;
  try {
    signedUrl = await getSignedURL(pdf.storagePath, 3600);
  } catch {
    // Non-fatal — we can still return the metadata
    console.warn("Failed to generate signed URL for", pdf.storagePath);
  }

  // Return text preview (don't send full extracted text unless needed)
  return apiSuccess({
    ...pdf,
    extractedText: pdf.extractedText.slice(0, 1000) + (pdf.extractedText.length > 1000 ? "..." : ""),
    signedUrl,
  });
}

// ── DELETE /api/pdf/:id ───────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const pdf = await prisma.pDFDocument.findUnique({
    where: { id: params.id },
    select: { userId: true, storagePath: true, _count: { select: { quizzes: true } } },
  });

  if (!pdf) {
    return apiError("PDF not found", 404);
  }

  if (pdf.userId !== session!.user.id && session!.user.role !== "ADMIN") {
    return apiError("You do not have permission to delete this PDF", 403);
  }

  // Warn if PDF has associated quizzes
  if (pdf._count.quizzes > 0) {
    // We allow deletion — quizzes keep pdfDocumentId as null (SetNull behavior)
    console.info(`Deleting PDF with ${pdf._count.quizzes} associated quizzes`);
  }

  // Delete from Supabase Storage
  try {
    await deletePDFFromStorage(pdf.storagePath);
  } catch (err) {
    console.error("Storage delete failed:", err);
    // Continue with DB deletion even if storage fails
  }

  // Delete from database (quizzes will have pdfDocumentId set to null)
  await prisma.pDFDocument.delete({ where: { id: params.id } });

  return apiSuccess({ message: "PDF deleted successfully" });
}
