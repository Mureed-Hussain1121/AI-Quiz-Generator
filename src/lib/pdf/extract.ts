/**
 * PDF text extraction utility.
 * We dynamically import pdf-parse to avoid Next.js issues with the module's
 * test file that tries to read from the filesystem at import time.
 */

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
  wordCount: number;
}

export async function extractTextFromPDF(
  buffer: Buffer
): Promise<PDFExtractionResult> {
  // Dynamic import avoids the test-file issue in Next.js
  const pdfParse = (await import("pdf-parse")).default;

  let result;
  try {
    result = await pdfParse(buffer, {
      // Limit to 100 pages to prevent DoS
      max: 100,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to parse PDF: ${message}`);
  }

  const text = result.text?.trim() ?? "";

  if (!text || text.length < 50) {
    throw new Error(
      "Could not extract readable text from this PDF. " +
        "The file may be scanned, image-based, or password-protected. " +
        "Please use a text-based PDF."
    );
  }

  // Clean up excessive whitespace
  const cleanedText = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")  // Collapse 3+ newlines to 2
    .replace(/[^\S\n]{2,}/g, " ") // Collapse multiple spaces (but not newlines)
    .trim();

  const wordCount = cleanedText
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  return {
    text: cleanedText,
    pageCount: result.numpages ?? 0,
    wordCount,
  };
}

/**
 * Validates that a buffer is a valid PDF by checking the magic bytes.
 * %PDF- is the standard PDF header.
 */
export function isPDFBuffer(buffer: Buffer): boolean {
  if (buffer.length < 5) return false;
  return buffer.slice(0, 5).toString("ascii") === "%PDF-";
}

/**
 * Sanitizes a filename for safe storage.
 * Removes special characters, replaces spaces with hyphens.
 */
export function sanitizeFileName(originalName: string): string {
  const ext = ".pdf";
  const baseName = originalName.replace(/\.pdf$/i, "");
  const sanitized = baseName
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

  return sanitized || "document";
}
