/**
 * Image Import Pipeline
 *
 * Downloads an external image URL, validates, processes (resize + WebP),
 * checks for duplicates via content hash, and uploads to Supabase Storage.
 *
 * Returns the storage path (not the full URL) for database storage.
 * Public URLs are generated at serve time from the path.
 */

import crypto from "crypto";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseServiceRoleKey } from "../config/supabase";
import { validateImageUrl } from "../utils/urlValidator";
import * as db from "../utils/db";

// ─── Configuration ──────────────────────────────────────────────────────────

const BUCKET = "product-images";

const CONFIG = {
  download: {
    timeoutMs: 15_000,
    maxSizeBytes: 15 * 1024 * 1024, // 15MB
    maxRedirects: 3,
    userAgent: "StyleSense-ImageBot/1.0",
  },
  processing: {
    maxWidth: 1200,
    maxHeight: 1600,
    webpQuality: 82,
    webpEffort: 4,
  },
  retry: {
    maxRetries: 3,
    baseDelayMs: 2000,
    backoffMultiplier: 4,
    maxDelayMs: 30_000,
    retryableStatuses: [429, 500, 502, 503, 504] as number[],
  },
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
} as const;

// ─── Supabase Client ────────────────────────────────────────────────────────

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PipelineResult {
  success: boolean;
  storagePath?: string;
  contentHash?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  format?: string;
  wasDuplicate?: boolean;
  error?: string;
  errorCode?: string;
}

export interface ImportOptions {
  sourceUrl: string;
  category: string;
  slug: string;
}

// ─── URL Resolver ───────────────────────────────────────────────────────────

/**
 * Generate the public URL from a storage path.
 * This is the ONLY place URLs are constructed from paths.
 */
export function resolvePublicUrl(storagePath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

// ─── Pipeline ───────────────────────────────────────────────────────────────

/**
 * Run the full image import pipeline:
 * validate → download → process → dedup check → upload
 */
export async function importImage(options: ImportOptions): Promise<PipelineResult> {
  const { sourceUrl, category, slug } = options;

  // 1. Validate URL (SSRF protection)
  const validation = await validateImageUrl(sourceUrl);
  if (!validation.valid) {
    return { success: false, error: validation.error, errorCode: "INVALID_URL" };
  }

  // 2. Download with retry
  let buffer: Buffer;
  try {
    buffer = await downloadWithRetry(sourceUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Download failed";
    return { success: false, error: message, errorCode: "DOWNLOAD_FAILED" };
  }

  // 3. Validate actual image content with Sharp
  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(buffer).metadata();
    if (!metadata.format || !["jpeg", "png", "webp", "avif", "gif", "tiff"].includes(metadata.format)) {
      return { success: false, error: `Unsupported image format: ${metadata.format}`, errorCode: "INVALID_FORMAT" };
    }
  } catch {
    return { success: false, error: "File is not a valid image.", errorCode: "INVALID_IMAGE" };
  }

  // 4. Process: resize + convert to WebP
  let processed: Buffer;
  try {
    processed = await sharp(buffer)
      .rotate() // Auto-orient from EXIF
      .resize({
        width: CONFIG.processing.maxWidth,
        height: CONFIG.processing.maxHeight,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: CONFIG.processing.webpQuality,
        effort: CONFIG.processing.webpEffort,
        smartSubsample: true,
      })
      .toBuffer();
  } catch {
    return { success: false, error: "Image processing failed.", errorCode: "PROCESSING_FAILED" };
  }

  // 5. Compute content hash
  const contentHash = crypto.createHash("sha256").update(processed).digest("hex");
  const shortHash = contentHash.slice(0, 8);

  // 6. Check for duplicate (graceful - works before product_images table exists)
  let existingPath: string | null = null;
  try {
    const existingQ = await db.query(
      "SELECT storage_path FROM product_images WHERE content_hash = $1 LIMIT 1",
      [contentHash]
    );
    if (existingQ.rows.length > 0) {
      existingPath = existingQ.rows[0].storage_path;
    }
  } catch {
    // Table may not exist yet - skip dedup check
  }

  if (existingPath) {
    return {
      success: true,
      storagePath: existingPath,
      contentHash,
      width: (await sharp(processed).metadata()).width,
      height: (await sharp(processed).metadata()).height,
      sizeBytes: processed.length,
      format: "webp",
      wasDuplicate: true,
    };
  }

  // 7. Get final processed metadata
  const finalMeta = await sharp(processed).metadata();

  // 8. Build storage path
  const safeSlug = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  const safeCategory = category
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "other";
  const storagePath = `products/${safeCategory}/${shortHash}-${safeSlug}.webp`;

  // 9. Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, processed, {
      contentType: "image/webp",
      cacheControl: "public, max-age=31536000, immutable",
      upsert: false,
    });

  if (uploadError) {
    // If file already exists (race condition), treat as success
    if (uploadError.message?.includes("already exists") || uploadError.message?.includes("Duplicate")) {
      return {
        success: true,
        storagePath,
        contentHash,
        width: finalMeta.width,
        height: finalMeta.height,
        sizeBytes: processed.length,
        format: "webp",
        wasDuplicate: true,
      };
    }
    return { success: false, error: `Upload failed: ${uploadError.message}`, errorCode: "UPLOAD_FAILED" };
  }

  return {
    success: true,
    storagePath,
    contentHash,
    width: finalMeta.width,
    height: finalMeta.height,
    sizeBytes: processed.length,
    format: "webp",
    wasDuplicate: false,
  };
}

// ─── Download with Retry ────────────────────────────────────────────────────

async function downloadWithRetry(url: string): Promise<Buffer> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= CONFIG.retry.maxRetries; attempt++) {
    try {
      return await downloadImage(url);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Check if retryable
      if (attempt >= CONFIG.retry.maxRetries) break;
      if (!isRetryableError(lastError)) break;

      // Wait with exponential backoff
      const delay = Math.min(
        CONFIG.retry.baseDelayMs * Math.pow(CONFIG.retry.backoffMultiplier, attempt),
        CONFIG.retry.maxDelayMs
      );
      await sleep(delay);
    }
  }

  throw lastError || new Error("Download failed after retries");
}

async function downloadImage(url: string): Promise<Buffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.download.timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": CONFIG.download.userAgent,
        Accept: "image/*",
      },
    });

    if (!response.ok) {
      const err = new Error(`HTTP ${response.status}: ${response.statusText}`);
      (err as any).statusCode = response.status;
      throw err;
    }

    // Validate content-type header
    const contentType = response.headers.get("content-type") || "";
    if (!CONFIG.allowedMimeTypes.some((t) => contentType.includes(t))) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    // Read response with size limit
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > CONFIG.download.maxSizeBytes) {
      throw new Error(`Image exceeds ${CONFIG.download.maxSizeBytes / 1024 / 1024}MB limit.`);
    }

    if (buffer.length < 1024) {
      throw new Error("Downloaded file is too small - likely an error page.");
    }

    return buffer;
  } finally {
    clearTimeout(timeout);
  }
}

function isRetryableError(err: Error): boolean {
  // Timeout/network errors
  if (err.name === "AbortError") return true;
  if (/ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND|UND_ERR/i.test(err.message)) return true;

  // HTTP status codes
  const statusCode = (err as any).statusCode;
  if (typeof statusCode === "number" && CONFIG.retry.retryableStatuses.includes(statusCode)) return true;

  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
