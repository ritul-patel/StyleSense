import { Router, type Response } from "express";
import * as db from "../utils/db";
import { adminMiddleware } from "../middleware/adminAuth";
import type { AuthenticatedRequest } from "../middleware/auth";
import { generateProductMetadata } from "../services/metadataProvider";

const router = Router();
router.use(adminMiddleware);

// POST /api/v1/admin/metadata/generate-batch — generate metadata for multiple products
router.post("/generate-batch", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productIds } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: "productIds array is required." });
    }

    if (productIds.length > 20) {
      return res.status(400).json({ success: false, message: "Maximum 20 products per batch." });
    }

    const results: { id: string; name: string; success: boolean; duration_ms: number; error?: string }[] = [];

    for (const id of productIds) {
      const q = await db.query("SELECT id, name, brand, category, image_url, primary_color, description FROM products WHERE id = $1", [id]);
      if (q.rows.length === 0) {
        results.push({ id, name: "—", success: false, duration_ms: 0, error: "Product not found" });
        continue;
      }

      const product = q.rows[0];
      const result = await generateProductMetadata({
        name: product.name,
        brand: product.brand,
        category: product.category,
        image_url: product.image_url,
        primary_color: product.primary_color,
        description: product.description,
      });

      if (result.success && result.metadata) {
        await db.query("UPDATE products SET ai_metadata = $1 WHERE id = $2", [JSON.stringify(result.metadata), id]);
        results.push({ id, name: product.name, success: true, duration_ms: result.duration_ms });
      } else {
        results.push({ id, name: product.name, success: false, duration_ms: result.duration_ms, error: result.error });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return res.json({ success: true, total: productIds.length, succeeded, failed, results });
  } catch (err: any) {
    console.error("[admin/metadata] batch error:", err.message);
    return res.status(500).json({ success: false, message: "Batch generation failed." });
  }
});

// GET /api/v1/admin/metadata/status — get products by metadata status
router.get("/status", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const q = await db.query(`
      SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE image_url IS NOT NULL AND image_url != '') ::int as has_image,
        COUNT(*) FILTER (WHERE ai_metadata IS NOT NULL AND ai_metadata != '{}'::jsonb) ::int as has_metadata,
        COUNT(*) FILTER (WHERE is_published) ::int as published,
        COUNT(*) FILTER (WHERE NOT is_published AND (image_url IS NULL OR image_url = '')) ::int as draft,
        COUNT(*) FILTER (WHERE NOT is_published AND image_url IS NOT NULL AND image_url != '' AND (ai_metadata IS NULL OR ai_metadata = '{}'::jsonb)) ::int as needs_metadata,
        COUNT(*) FILTER (WHERE NOT is_published AND ai_metadata IS NOT NULL AND ai_metadata != '{}'::jsonb) ::int as ready_to_publish
      FROM products
    `, []);

    return res.json(q.rows[0] || {});
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Failed to fetch status." });
  }
});

export default router;
