import { Router, type Response } from "express";
import multer from "multer";
import * as db from "../utils/db";
import { adminMiddleware } from "../middleware/adminAuth";
import type { AuthenticatedRequest } from "../middleware/auth";
import { uploadProductImage, slugFromFilename, resolveStorageUrl } from "../services/storageService";
import { importImage, resolvePublicUrl } from "../services/imagePipeline";

const router = Router();
router.use(adminMiddleware);

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (_req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, and WebP images are allowed."));
  },
});

// POST /api/v1/admin/images/upload - upload single image
router.post("/upload", upload.single("image"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image file provided." });

    const result = await uploadProductImage(req.file.buffer, req.file.originalname, req.file.mimetype);
    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error || "Upload failed." });
    }

    return res.json({
      success: true,
      url: result.publicUrl,
      path: result.path,
      slug: slugFromFilename(req.file.originalname),
    });
  } catch (err: any) {
    console.error("[admin/images] upload error:", err.message);
    return res.status(500).json({ success: false, message: "Upload failed." });
  }
});

// POST /api/v1/admin/images/upload-batch - upload multiple images
router.post("/upload-batch", upload.array("images", 50), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) return res.status(400).json({ success: false, message: "No files provided." });

    const results: { filename: string; slug: string; url?: string; error?: string; matched?: boolean; productId?: string }[] = [];

    for (const file of files) {
      const uploadResult = await uploadProductImage(file.buffer, file.originalname, file.mimetype);
      const slug = slugFromFilename(file.originalname);

      if (!uploadResult.success) {
        results.push({ filename: file.originalname, slug, error: uploadResult.error });
        continue;
      }

      // Try to auto-match to a product by slug
      const matchQ = await db.query("SELECT id FROM products WHERE slug = $1", [slug]);
      let matched = false;
      let productId: string | undefined;

      if (matchQ.rows.length > 0) {
        productId = matchQ.rows[0].id;
        await db.query("UPDATE products SET image_url = $1 WHERE id = $2", [uploadResult.publicUrl, productId]);
        matched = true;
      }

      results.push({ filename: file.originalname, slug, url: uploadResult.publicUrl, matched, productId });
    }

    const uploaded = results.filter((r) => r.url).length;
    const matchedCount = results.filter((r) => r.matched).length;
    const failed = results.filter((r) => r.error).length;

    return res.json({
      success: true,
      total: files.length,
      uploaded,
      matched: matchedCount,
      unmatched: uploaded - matchedCount,
      failed,
      results,
    });
  } catch (err: any) {
    console.error("[admin/images] batch upload error:", err.message);
    return res.status(500).json({ success: false, message: "Batch upload failed." });
  }
});

// POST /api/v1/admin/images/match - manually match an image URL to a product
router.post("/match", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, imageUrl } = req.body;
    if (!productId || !imageUrl) return res.status(400).json({ success: false, message: "productId and imageUrl required." });

    const q = await db.query("UPDATE products SET image_url = $1 WHERE id = $2 RETURNING id", [imageUrl, productId]);
    if (q.rows.length === 0) return res.status(404).json({ success: false, message: "Product not found." });

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Match failed." });
  }
});

// ─── URL Import Pipeline Endpoints ──────────────────────────────────────────

// POST /api/v1/admin/images/import - import single image from external URL
router.post("/import", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { product_id, source_url, category, role } = req.body;

    if (!product_id || typeof product_id !== "string") {
      return res.status(400).json({ success: false, message: "product_id is required.", code: "MISSING_PRODUCT_ID" });
    }
    if (!source_url || typeof source_url !== "string") {
      return res.status(400).json({ success: false, message: "source_url is required.", code: "MISSING_SOURCE_URL" });
    }

    // Verify product exists and get slug/category
    const productQ = await db.query("SELECT id, slug, category FROM products WHERE id = $1", [product_id]);
    if (productQ.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found.", code: "PRODUCT_NOT_FOUND" });
    }

    const product = productQ.rows[0];
    const imageCategory = category || product.category || "other";
    const imageSlug = product.slug || product_id.slice(0, 8);

    // Run pipeline
    const result = await importImage({
      sourceUrl: source_url,
      category: imageCategory,
      slug: imageSlug,
    });

    if (!result.success) {
      return res.status(422).json({
        success: false,
        message: result.error || "Image import failed.",
        code: result.errorCode || "IMPORT_FAILED",
      });
    }

    // Update product image_url with the public URL
    const publicUrl = resolvePublicUrl(result.storagePath!);
    await db.query("UPDATE products SET image_url = $1 WHERE id = $2", [publicUrl, product_id]);

    // Try to insert into product_images table (if it exists)
    try {
      await db.query(
        `INSERT INTO product_images (product_id, position, role, source_url, storage_path, content_hash, width, height, size_bytes, format, processing_status)
         VALUES ($1, 0, $2, $3, $4, $5, $6, $7, $8, $9, 'completed')
         ON CONFLICT (product_id, position) DO UPDATE SET
           source_url = EXCLUDED.source_url,
           storage_path = EXCLUDED.storage_path,
           content_hash = EXCLUDED.content_hash,
           width = EXCLUDED.width,
           height = EXCLUDED.height,
           size_bytes = EXCLUDED.size_bytes,
           format = EXCLUDED.format,
           processing_status = EXCLUDED.processing_status,
           updated_at = now()`,
        [
          product_id,
          role || "primary",
          source_url,
          result.storagePath,
          result.contentHash,
          result.width,
          result.height,
          result.sizeBytes,
          result.format,
        ]
      );
    } catch {
      // product_images table may not exist yet - non-fatal
    }

    return res.status(201).json({
      success: true,
      data: {
        storage_path: result.storagePath,
        public_url: publicUrl,
        width: result.width,
        height: result.height,
        size_bytes: result.sizeBytes,
        format: result.format,
        content_hash: result.contentHash,
        was_duplicate: result.wasDuplicate,
      },
    });
  } catch (err: any) {
    console.error("[admin/images] import error:", err.message);
    return res.status(500).json({ success: false, message: "Image import failed.", code: "INTERNAL_ERROR" });
  }
});

// POST /api/v1/admin/images/import-batch - import multiple images from URLs
router.post("/import-batch", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "items array is required.", code: "MISSING_ITEMS" });
    }
    if (items.length > 50) {
      return res.status(400).json({ success: false, message: "Maximum 50 items per batch.", code: "BATCH_TOO_LARGE" });
    }

    const results: Array<{
      product_id: string;
      status: "completed" | "duplicate" | "failed";
      public_url?: string;
      storage_path?: string;
      error?: string;
    }> = [];

    for (const item of items) {
      const { product_id, source_url } = item;

      if (!product_id || !source_url) {
        results.push({ product_id: product_id || "unknown", status: "failed", error: "Missing product_id or source_url." });
        continue;
      }

      // Get product info
      const productQ = await db.query("SELECT id, slug, category FROM products WHERE id = $1", [product_id]);
      if (productQ.rows.length === 0) {
        results.push({ product_id, status: "failed", error: "Product not found." });
        continue;
      }

      const product = productQ.rows[0];

      try {
        const result = await importImage({
          sourceUrl: source_url,
          category: product.category || "other",
          slug: product.slug || product_id.slice(0, 8),
        });

        if (!result.success) {
          results.push({ product_id, status: "failed", error: result.error });
          continue;
        }

        // Update product
        const publicUrl = resolvePublicUrl(result.storagePath!);
        await db.query("UPDATE products SET image_url = $1 WHERE id = $2", [publicUrl, product_id]);

        results.push({
          product_id,
          status: result.wasDuplicate ? "duplicate" : "completed",
          public_url: publicUrl,
          storage_path: result.storagePath,
        });
      } catch (err: any) {
        results.push({ product_id, status: "failed", error: err.message || "Unknown error." });
      }

      // Small delay between items to avoid overwhelming upstream CDNs
      await new Promise((r) => setTimeout(r, 300));
    }

    const completed = results.filter((r) => r.status === "completed").length;
    const duplicates = results.filter((r) => r.status === "duplicate").length;
    const failed = results.filter((r) => r.status === "failed").length;

    return res.json({
      success: true,
      data: {
        total: items.length,
        completed,
        duplicates,
        failed,
        results,
      },
    });
  } catch (err: any) {
    console.error("[admin/images] import-batch error:", err.message);
    return res.status(500).json({ success: false, message: "Batch import failed.", code: "INTERNAL_ERROR" });
  }
});

// POST /api/v1/admin/images/:imageId/reimport - re-download and reprocess
router.post("/:imageId/reimport", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { imageId } = req.params;

    // Look up the image record
    let imageRow: any;
    try {
      const q = await db.query("SELECT * FROM product_images WHERE id = $1", [imageId]);
      if (q.rows.length === 0) return res.status(404).json({ success: false, message: "Image not found." });
      imageRow = q.rows[0];
    } catch {
      return res.status(404).json({ success: false, message: "Image tracking not available." });
    }

    if (!imageRow.source_url) {
      return res.status(400).json({ success: false, message: "No source URL available for re-import." });
    }

    // Get product info for slug/category
    const productQ = await db.query("SELECT slug, category FROM products WHERE id = $1", [imageRow.product_id]);
    const product = productQ.rows[0] || { slug: "product", category: "other" };

    // Run pipeline
    const result = await importImage({
      sourceUrl: imageRow.source_url,
      category: product.category || "other",
      slug: product.slug || imageRow.product_id.slice(0, 8),
    });

    if (!result.success) {
      // Update status to failed
      try {
        await db.query(
          "UPDATE product_images SET processing_status = 'failed', processing_error = $1, retry_count = retry_count + 1, last_attempted_at = now() WHERE id = $2",
          [result.error, imageId]
        );
      } catch { /* non-fatal */ }
      return res.status(422).json({ success: false, message: result.error, code: result.errorCode });
    }

    // Update records
    const publicUrl = resolvePublicUrl(result.storagePath!);
    await db.query("UPDATE products SET image_url = $1 WHERE id = $2", [publicUrl, imageRow.product_id]);

    try {
      await db.query(
        `UPDATE product_images SET
          storage_path = $1, content_hash = $2, width = $3, height = $4,
          size_bytes = $5, format = $6, processing_status = 'completed',
          processing_error = '', last_attempted_at = now(), updated_at = now()
         WHERE id = $7`,
        [result.storagePath, result.contentHash, result.width, result.height, result.sizeBytes, result.format, imageId]
      );
    } catch { /* non-fatal */ }

    return res.json({
      success: true,
      data: {
        storage_path: result.storagePath,
        public_url: publicUrl,
        width: result.width,
        height: result.height,
        size_bytes: result.sizeBytes,
        was_duplicate: result.wasDuplicate,
      },
    });
  } catch (err: any) {
    console.error("[admin/images] reimport error:", err.message);
    return res.status(500).json({ success: false, message: "Re-import failed." });
  }
});

// DELETE /api/v1/admin/images/:imageId - delete image from storage + DB
router.delete("/:imageId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { imageId } = req.params;

    let imageRow: any;
    try {
      const q = await db.query("SELECT * FROM product_images WHERE id = $1", [imageId]);
      if (q.rows.length === 0) return res.status(404).json({ success: false, message: "Image not found." });
      imageRow = q.rows[0];
    } catch {
      return res.status(404).json({ success: false, message: "Image tracking not available." });
    }

    // Delete from storage
    if (imageRow.storage_path) {
      const { createClient } = await import("@supabase/supabase-js");
      const { supabaseUrl: url, supabaseServiceRoleKey: key } = await import("../config/supabase");
      const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
      await client.storage.from("product-images").remove([imageRow.storage_path]);
    }

    // Delete DB record
    await db.query("DELETE FROM product_images WHERE id = $1", [imageId]);

    // Clear product image_url if it was the primary
    if (imageRow.position === 0) {
      await db.query("UPDATE products SET image_url = '' WHERE id = $1", [imageRow.product_id]);
    }

    return res.json({ success: true, message: "Image deleted." });
  } catch (err: any) {
    console.error("[admin/images] delete error:", err.message);
    return res.status(500).json({ success: false, message: "Delete failed." });
  }
});

// GET /api/v1/admin/images/migration/status - migration progress
router.get("/migration/status", async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Count products with external URLs that haven't been migrated
    const totalQ = await db.query("SELECT COUNT(*)::int as total FROM products WHERE image_url != '' AND image_url IS NOT NULL", []);
    const total = totalQ.rows[0]?.total || 0;

    // Count products still pointing to external URLs (not yet migrated)
    const pendingQ = await db.query("SELECT COUNT(*)::int as count FROM products WHERE image_url != '' AND image_url IS NOT NULL AND image_url LIKE 'http%' AND image_url NOT LIKE '%supabase.co/storage%'", []);
    const externalPending = pendingQ.rows[0]?.count || 0;

    // Check product_images for failed/processing counts
    let failed = 0;
    let processing = 0;

    try {
      const statusQ = await db.query(`
        SELECT processing_status, COUNT(*)::int as count
        FROM product_images
        WHERE processing_status IN ('failed', 'processing')
        GROUP BY processing_status
      `, []);
      for (const row of statusQ.rows) {
        if (row.processing_status === "failed") failed = row.count;
        else if (row.processing_status === "processing") processing = row.count;
      }
    } catch {
      // Table doesn't exist yet - ignore
    }

    return res.json({
      success: true,
      data: {
        total_products_with_images: total,
        migrated: total - externalPending,
        pending: externalPending,
        processing,
        failed,
        percent: total > 0 ? Math.round(((total - externalPending) / total) * 100) : 0,
      },
    });
  } catch (err: any) {
    console.error("[admin/images] migration status error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to get migration status." });
  }
});

// POST /api/v1/admin/images/migration/start - begin migrating all unmigrated products
router.post("/migration/start", async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Find all products with EXTERNAL image URLs that haven't been migrated.
    // Exclude products already pointing to Supabase Storage.
    const productsQ = await db.query(`
      SELECT id, slug, category, image_url
      FROM products
      WHERE image_url != '' AND image_url IS NOT NULL
        AND image_url LIKE 'http%'
        AND image_url NOT LIKE '%supabase.co/storage%'
      ORDER BY created_at ASC
      LIMIT 100
    `, []);

    if (productsQ.rows.length === 0) {
      return res.json({ success: true, data: { message: "No products to migrate.", processed: 0 } });
    }

    const results: Array<{ product_id: string; status: string; error?: string }> = [];

    for (const product of productsQ.rows) {
      // Skip if already migrated (check product_images table)
      try {
        const existsQ = await db.query(
          "SELECT id FROM product_images WHERE product_id = $1 AND processing_status = 'completed' LIMIT 1",
          [product.id]
        );
        if (existsQ.rows.length > 0) {
          results.push({ product_id: product.id, status: "already_migrated" });
          continue;
        }
      } catch { /* table may not exist */ }

      try {
        const result = await importImage({
          sourceUrl: product.image_url,
          category: product.category || "other",
          slug: product.slug || product.id.slice(0, 8),
        });

        if (result.success) {
          const publicUrl = resolvePublicUrl(result.storagePath!);
          await db.query("UPDATE products SET image_url = $1 WHERE id = $2", [publicUrl, product.id]);

          // Record in product_images (if table exists)
          try {
            await db.query(
              `INSERT INTO product_images (product_id, position, role, source_url, storage_path, content_hash, width, height, size_bytes, format, processing_status)
               VALUES ($1, 0, 'primary', $2, $3, $4, $5, $6, $7, $8, 'completed')
               ON CONFLICT (product_id, position) DO UPDATE SET
                 storage_path = EXCLUDED.storage_path, content_hash = EXCLUDED.content_hash,
                 width = EXCLUDED.width, height = EXCLUDED.height, size_bytes = EXCLUDED.size_bytes,
                 processing_status = 'completed', updated_at = now()`,
              [product.id, product.image_url, result.storagePath, result.contentHash, result.width, result.height, result.sizeBytes, result.format]
            );
          } catch { /* non-fatal */ }

          results.push({ product_id: product.id, status: result.wasDuplicate ? "duplicate" : "completed" });
        } else {
          results.push({ product_id: product.id, status: "failed", error: result.error });
        }
      } catch (err: any) {
        results.push({ product_id: product.id, status: "failed", error: err.message });
      }

      // Throttle: 500ms between items to avoid upstream rate limits
      await new Promise((r) => setTimeout(r, 500));
    }

    const completed = results.filter((r) => r.status === "completed" || r.status === "duplicate").length;
    const failed = results.filter((r) => r.status === "failed").length;
    const skipped = results.filter((r) => r.status === "already_migrated").length;

    return res.json({
      success: true,
      data: {
        total: productsQ.rows.length,
        completed,
        failed,
        skipped,
        results,
      },
    });
  } catch (err: any) {
    console.error("[admin/images] migration start error:", err.message);
    return res.status(500).json({ success: false, message: "Migration failed." });
  }
});

// POST /api/v1/admin/images/import-outfits - import outfit images from URL array
// Returns the new Storage URLs to update the static outfits.ts file
router.post("/import-outfits", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { outfits } = req.body;

    if (!Array.isArray(outfits) || outfits.length === 0) {
      return res.status(400).json({ success: false, message: "outfits array is required. Each item needs: { outfit_id, imageUrl }" });
    }

    const results: Array<{
      outfit_id: string;
      status: "completed" | "failed";
      original_url: string;
      storage_url?: string;
      storage_path?: string;
      error?: string;
    }> = [];

    for (const outfit of outfits) {
      const { outfit_id, imageUrl } = outfit;
      if (!outfit_id || !imageUrl) {
        results.push({ outfit_id: outfit_id || "unknown", status: "failed", original_url: imageUrl || "", error: "Missing outfit_id or imageUrl" });
        continue;
      }

      try {
        const result = await importImage({
          sourceUrl: imageUrl,
          category: "outfits",
          slug: outfit_id.toLowerCase(),
        });

        if (result.success) {
          const publicUrl = resolvePublicUrl(result.storagePath!);
          results.push({
            outfit_id,
            status: "completed",
            original_url: imageUrl,
            storage_url: publicUrl,
            storage_path: result.storagePath,
          });
        } else {
          results.push({ outfit_id, status: "failed", original_url: imageUrl, error: result.error });
        }
      } catch (err: any) {
        results.push({ outfit_id, status: "failed", original_url: imageUrl, error: err.message });
      }

      // Throttle
      await new Promise((r) => setTimeout(r, 500));
    }

    const completed = results.filter((r) => r.status === "completed").length;
    const failed = results.filter((r) => r.status === "failed").length;

    return res.json({
      success: true,
      data: {
        total: outfits.length,
        completed,
        failed,
        results,
      },
    });
  } catch (err: any) {
    console.error("[admin/images] import-outfits error:", err.message);
    return res.status(500).json({ success: false, message: "Outfit import failed." });
  }
});

// POST /api/v1/admin/images/migration/retry - retry all failed items
router.post("/migration/retry", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await db.query(
      "UPDATE product_images SET processing_status = 'pending', processing_error = '', retry_count = 0 WHERE processing_status = 'failed' RETURNING id",
      []
    );
    return res.json({
      success: true,
      data: { reset_count: updated.rows.length },
    });
  } catch (err: any) {
    // Table may not exist
    return res.json({ success: true, data: { reset_count: 0, note: "product_images table not available." } });
  }
});

export default router;
