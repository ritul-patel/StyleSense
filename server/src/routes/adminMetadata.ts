import { Router, type Response } from "express";
import * as db from "../utils/db";
import { adminMiddleware } from "../middleware/adminAuth";
import type { AuthenticatedRequest } from "../middleware/auth";
import { generateProductMetadata } from "../services/metadataProvider";

const router = Router();
router.use(adminMiddleware);

// ─── Retry Configuration ────────────────────────────────────────────────────

const RETRY_DELAYS = [10_000, 30_000, 60_000]; // 10s, 30s, 60s
const RATE_LIMIT_PAUSE = 60_000; // 60s pause on 429
const BETWEEN_PRODUCTS_DELAY = 4_000; // 4s between products (stay under 15 RPM)

function isRateLimited(error: string | undefined): boolean {
  if (!error) return false;
  return /429|rate.limit|RESOURCE_EXHAUSTED/i.test(error);
}

function isRetryable(error: string | undefined): boolean {
  if (!error) return false;
  return /429|timeout|ETIMEDOUT|ECONNRESET|rate.limit|fetch failed|network|RESOURCE_EXHAUSTED/i.test(error);
}

function hasSubstance(metadata: any): boolean {
  if (!metadata) return false;
  // Must have at least primary_color OR description, AND confidence > 0
  const hasColor = typeof metadata.primary_color === "string" && metadata.primary_color.trim().length > 0;
  const hasDesc = typeof metadata.description === "string" && metadata.description.trim().length > 0;
  const hasConfidence = typeof metadata.confidence === "number" && metadata.confidence > 0;
  return (hasColor || hasDesc) && hasConfidence;
}

// ─── Single Product Generation with Retry ───────────────────────────────────

async function generateSingleProduct(product: any): Promise<{
  success: boolean;
  metadata?: any;
  duration_ms: number;
  error?: string;
  errorType?: string;
  retries: number;
  hitRateLimit: boolean;
}> {
  let lastError = "";
  let lastErrorType = "";
  let hitRateLimit = false;
  const totalStart = Date.now();

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    const result = await generateProductMetadata({
      name: product.name,
      brand: product.brand,
      category: product.category,
      image_url: product.image_url,
      primary_color: product.primary_color,
      description: product.description,
    });

    if (result.success && result.metadata) {
      // Verify metadata has substance before accepting
      if (!hasSubstance(result.metadata)) {
        lastError = "AI returned empty/zero-confidence metadata";
        lastErrorType = "empty_response";
        // Don't retry empty responses — AI just couldn't analyze this product
        break;
      }
      return {
        success: true,
        metadata: result.metadata,
        duration_ms: Date.now() - totalStart,
        retries: attempt,
        hitRateLimit,
      };
    }

    lastError = result.error || "Unknown error";

    // Classify error type
    if (isRateLimited(lastError)) {
      lastErrorType = "rate_limited";
      hitRateLimit = true;
    } else if (/timeout|ETIMEDOUT/i.test(lastError)) {
      lastErrorType = "timeout";
    } else if (/invalid.*json|unparseable|parse/i.test(lastError)) {
      lastErrorType = "invalid_response";
    } else if (/validation/i.test(lastError)) {
      lastErrorType = "validation_failed";
    } else {
      lastErrorType = "unknown";
    }

    // Should we retry?
    if (!isRetryable(lastError) || attempt >= RETRY_DELAYS.length) break;

    // Rate limit gets a longer pause
    const delay = isRateLimited(lastError) ? RATE_LIMIT_PAUSE : RETRY_DELAYS[attempt];
    console.log(`[metadata] Retry ${attempt + 1}/${RETRY_DELAYS.length} for "${product.name}" — waiting ${delay / 1000}s (${lastErrorType})`);
    await new Promise((r) => setTimeout(r, delay));
  }

  return {
    success: false,
    duration_ms: Date.now() - totalStart,
    error: lastError,
    errorType: lastErrorType,
    retries: RETRY_DELAYS.length,
    hitRateLimit,
  };
}

// ─── POST /generate-batch ───────────────────────────────────────────────────

router.post("/generate-batch", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productIds, skipExisting = true, retryFailed = false } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: "productIds array is required." });
    }
    if (productIds.length > 200) {
      return res.status(400).json({ success: false, message: "Maximum 200 products per batch." });
    }

    const results: Array<{
      id: string;
      name: string;
      success: boolean;
      duration_ms: number;
      retries: number;
      error?: string;
      errorType?: string;
      skipped?: boolean;
    }> = [];

    let rateLimitPaused = false;

    // Process ONE product at a time
    for (let i = 0; i < productIds.length; i++) {
      const id = productIds[i];

      const q = await db.query(
        "SELECT id, name, brand, category, image_url, primary_color, description, ai_metadata FROM products WHERE id = $1",
        [id]
      );

      if (q.rows.length === 0) {
        results.push({ id, name: "—", success: false, duration_ms: 0, retries: 0, error: "Product not found", errorType: "not_found" });
        continue;
      }

      const product = q.rows[0];

      // Skip if already has metadata (unless retrying failed)
      if (skipExisting && !retryFailed) {
        const existing = product.ai_metadata;
        if (existing && JSON.stringify(existing) !== "{}" && hasSubstance(existing)) {
          results.push({ id, name: product.name, success: true, duration_ms: 0, retries: 0, skipped: true });
          continue;
        }
      }

      // If we were rate limited on the previous product, wait before continuing
      if (rateLimitPaused) {
        console.log(`[metadata] Rate limit cooldown: waiting ${RATE_LIMIT_PAUSE / 1000}s before next product...`);
        await new Promise((r) => setTimeout(r, RATE_LIMIT_PAUSE));
        rateLimitPaused = false;
      }

      console.log(`[metadata] [${i + 1}/${productIds.length}] Processing "${product.name}"`);

      // Generate
      const result = await generateSingleProduct(product);

      if (result.success && result.metadata) {
        // Enrich with audit data
        const enriched = {
          ...result.metadata,
          _audit: {
            generated_at: new Date().toISOString(),
            provider: "gemini",
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
            duration_ms: result.duration_ms,
            retries: result.retries,
          },
        };

        // Save immediately
        const jsonStr = JSON.stringify(enriched);
        await db.query("UPDATE products SET ai_metadata = $1 WHERE id = $2", [jsonStr, id]);
        console.log(`[metadata] ✓ Saved "${product.name}" (${jsonStr.length} chars, confidence: ${result.metadata.confidence})`);
        results.push({ id, name: product.name, success: true, duration_ms: result.duration_ms, retries: result.retries });
      } else {
        console.warn(`[metadata] ✗ Failed "${product.name}": ${result.error} [${result.errorType}]`);
        results.push({ id, name: product.name, success: false, duration_ms: result.duration_ms, retries: result.retries, error: result.error, errorType: result.errorType });
      }

      // Track rate limit state for next iteration
      if (result.hitRateLimit) {
        rateLimitPaused = true;
      }

      // Delay between products (skip if we're about to rate-limit pause anyway)
      if (i < productIds.length - 1 && !rateLimitPaused) {
        await new Promise((r) => setTimeout(r, BETWEEN_PRODUCTS_DELAY));
      }
    }

    const succeeded = results.filter((r) => r.success && !r.skipped).length;
    const skipped = results.filter((r) => r.skipped).length;
    const failed = results.filter((r) => !r.success).length;

    return res.json({
      success: true,
      total: productIds.length,
      succeeded,
      skipped,
      failed,
      results,
    });
  } catch (err: any) {
    console.error("[admin/metadata] batch error:", err.message);
    return res.status(500).json({ success: false, message: "Batch generation failed." });
  }
});

// ─── PATCH /update/:id — edit metadata manually ─────────────────────────────

router.patch("/update/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { metadata } = req.body;

    if (!metadata || typeof metadata !== "object") {
      return res.status(400).json({ success: false, message: "metadata object is required." });
    }

    const existing = await db.query("SELECT ai_metadata FROM products WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const currentMetadata = existing.rows[0].ai_metadata || {};
    const updatedMetadata = {
      ...currentMetadata,
      ...metadata,
      _audit: {
        ...(currentMetadata._audit || {}),
        edited_at: new Date().toISOString(),
        edited_by: req.user?.email || req.user?.id || "admin",
      },
    };

    await db.query("UPDATE products SET ai_metadata = $1 WHERE id = $2", [JSON.stringify(updatedMetadata), id]);
    return res.json({ success: true, metadata: updatedMetadata });
  } catch (err: any) {
    console.error("[admin/metadata] update error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to update metadata." });
  }
});

// ─── POST /publish — publish/unpublish products ─────────────────────────────

router.post("/publish", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productIds, publish } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: "productIds array is required." });
    }
    if (typeof publish !== "boolean") {
      return res.status(400).json({ success: false, message: "publish (boolean) is required." });
    }

    if (publish) {
      const q = await db.query(
        `UPDATE products SET is_published = true WHERE id = ANY($1) AND ai_metadata IS NOT NULL AND ai_metadata != '{}'::jsonb RETURNING id`,
        [productIds]
      );
      return res.json({ success: true, updated: q.rows.length });
    } else {
      const q = await db.query(
        "UPDATE products SET is_published = false WHERE id = ANY($1) RETURNING id",
        [productIds]
      );
      return res.json({ success: true, updated: q.rows.length });
    }
  } catch (err: any) {
    console.error("[admin/metadata] publish error:", err.message);
    return res.status(500).json({ success: false, message: "Publish operation failed." });
  }
});

// ─── GET /status — metadata stats ───────────────────────────────────────────

router.get("/status", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const q = await db.query(`
      SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE image_url IS NOT NULL AND image_url != '') ::int as has_image,
        COUNT(*) FILTER (WHERE ai_metadata IS NOT NULL AND ai_metadata != '{}'::jsonb) ::int as has_metadata,
        COUNT(*) FILTER (WHERE is_published) ::int as published,
        COUNT(*) FILTER (WHERE NOT is_published AND (image_url IS NULL OR image_url = '')) ::int as draft,
        COUNT(*) FILTER (WHERE image_url IS NOT NULL AND image_url != '' AND (ai_metadata IS NULL OR ai_metadata = '{}'::jsonb)) ::int as needs_metadata,
        COUNT(*) FILTER (WHERE ai_metadata IS NOT NULL AND ai_metadata != '{}'::jsonb AND NOT is_published) ::int as ready_to_publish
      FROM products
    `, []);

    return res.json(q.rows[0] || {});
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Failed to fetch status." });
  }
});

export default router;
