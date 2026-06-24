import { z } from "zod";

const MAX_SIZE_MB = parseInt(process.env.UPLOAD_MAX_SIZE_MB ?? "10");
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export const pdfUploadSchema = z.object({
  fileName: z
    .string()
    .min(1, "File name is required")
    .max(255, "File name too long")
    .refine(
      (name) => name.toLowerCase().endsWith(".pdf"),
      "Only PDF files are allowed"
    ),
  fileSize: z
    .number()
    .positive("File size must be positive")
    .max(MAX_SIZE_BYTES, `File size must not exceed ${MAX_SIZE_MB}MB`),
  mimeType: z.literal("application/pdf", {
    errorMap: () => ({ message: "Only PDF files are allowed" }),
  }),
});

export const MAX_FILE_SIZE_BYTES = MAX_SIZE_BYTES;
export const MAX_FILE_SIZE_MB = MAX_SIZE_MB;
export const ALLOWED_MIME_TYPES = ["application/pdf"] as const;
