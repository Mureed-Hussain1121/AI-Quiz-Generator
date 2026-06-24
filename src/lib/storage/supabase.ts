import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";

const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME ?? "pdfs";
const LOCAL_UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR ?? "uploads/pdfs";

function hasSupabaseConfig(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getSupabaseAdmin(): SupabaseClient | null {
  if (!hasSupabaseConfig()) return null;

  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function getSafeLocalPath(storagePath: string): string {
  const root = path.resolve(process.cwd(), LOCAL_UPLOAD_DIR);
  const target = path.resolve(root, storagePath);

  if (!target.startsWith(root + path.sep)) {
    throw new Error("Invalid storage path");
  }

  return target;
}

// ── Ensure Supabase bucket exists on first run ────────────────

async function ensureBucket(supabaseAdmin: SupabaseClient) {
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) throw new Error(`Storage bucket check failed: ${listError.message}`);

  const exists = buckets?.some((b) => b.name === BUCKET_NAME);

  if (!exists) {
    const { error } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
      public: false,
      fileSizeLimit: parseInt(process.env.UPLOAD_MAX_SIZE_MB ?? "10") * 1024 * 1024,
      allowedMimeTypes: ["application/pdf"],
    });

    if (error) throw new Error(`Storage bucket creation failed: ${error.message}`);
  }
}

// ── Upload PDF ────────────────────────────────────────────────

export async function uploadPDFToStorage(
  fileBuffer: Buffer,
  storagePath: string // e.g. "user-id/filename-uuid.pdf"
): Promise<{ storagePath: string; provider: "supabase" | "local" }> {
  const supabaseAdmin = getSupabaseAdmin();

  if (!supabaseAdmin) {
    const localPath = getSafeLocalPath(storagePath);
    await mkdir(path.dirname(localPath), { recursive: true });
    await writeFile(localPath, fileBuffer);
    return { storagePath, provider: "local" };
  }

  await ensureBucket(supabaseAdmin);

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(storagePath, fileBuffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return { storagePath, provider: "supabase" };
}

// ── Get Signed URL (time-limited access) ─────────────────────

export async function getSignedURL(
  storagePath: string,
  expiresInSeconds = 3600 // 1 hour
): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin();

  if (!supabaseAdmin) {
    return `local://${storagePath}`;
  }

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${error?.message}`);
  }

  return data.signedUrl;
}

// ── Delete PDF ────────────────────────────────────────────────

export async function deletePDFFromStorage(storagePath: string): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  if (!supabaseAdmin) {
    const localPath = getSafeLocalPath(storagePath);
    await rm(localPath, { force: true });
    return;
  }

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .remove([storagePath]);

  if (error) {
    throw new Error(`Storage delete failed: ${error.message}`);
  }
}

export const supabaseAdmin = getSupabaseAdmin();
