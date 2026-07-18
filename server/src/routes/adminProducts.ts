import { Router, type Response } from "express";
import * as db from "../utils/db";
import { adminMiddleware } from "../middleware/adminAuth";
import type { AuthenticatedRequest } from "../middleware/auth";
import { generateProductMetadata } from "../services/metadataProvider";
import { invalidateProductsCache } from "./products";

const router = Router();
router.use(adminMiddleware);

// GET /api/v1/admin/products - list all (paginated, searchable)
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
    const published = req.query.published; // "true", "false", or undefined (all)

    let where = "WHERE 1=1";
    const params: any[] = [];
    let idx = 1;

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (name ILIKE $${idx} OR brand ILIKE $${idx})`;
      idx++;
    }
    if (category) {
      params.push(category);
      where += ` AND category = $${idx}`;
      idx++;
    }
    if (published === "true") {
      where += ` AND is_published = true`;
    } else if (published === "false") {
      where += ` AND is_published = false`;
    }

    const countQ = await db.query(`SELECT COUNT(*)::int as total FROM products ${where}`, params);
    const total = countQ.rows[0]?.total || 0;

    params.push(limit, offset);
    const q = await db.query(
      `SELECT id, name, slug, brand, category, price, currency, image_url, primary_color, is_published, ai_metadata, created_at, updated_at
       FROM products ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    return res.json({ products: q.rows, total, page, limit });
  } catch (err: any) {
    console.error("[admin/products] GET / error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch products." });
  }
});

// GET /api/v1/admin/products/:id
router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const q = await db.query("SELECT * FROM products WHERE id = $1", [req.params.id]);
    if (q.rows.length === 0) return res.status(404).json({ success: false, message: "Product not found." });
    return res.json(q.rows[0]);
  } catch (err: any) {
    console.error("[admin/products] GET /:id error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch product." });
  }
});

// POST /api/v1/admin/products - create
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, brand, category, description, price, currency, image_url, affiliate_url, store_url, primary_color, secondary_colors, seasons, occasions, styles, materials, fit, formality, is_published } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, message: "name is required." });
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);

    const q = await db.query(
      `INSERT INTO products (name, slug, brand, category, description, price, currency, image_url, affiliate_url, store_url, primary_color, secondary_colors, seasons, occasions, styles, materials, fit, formality, is_published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING *`,
      [
        name.trim(),
        slug,
        (brand || "").trim(),
        (category || "other").trim(),
        (description || "").trim(),
        Number(price) || 0,
        (currency || "INR").trim(),
        (image_url || "").trim(),
        (affiliate_url || "").trim(),
        (store_url || "").trim(),
        (primary_color || "").trim(),
        JSON.stringify(secondary_colors || []),
        JSON.stringify(seasons || []),
        JSON.stringify(occasions || []),
        JSON.stringify(styles || []),
        JSON.stringify(materials || []),
        (fit || "").trim(),
        (formality || "").trim(),
        is_published ?? false,
      ]
    );

    invalidateProductsCache();
    return res.status(201).json(q.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(409).json({ success: false, message: "A product with this name already exists." });
    }
    console.error("[admin/products] POST / error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to create product." });
  }
});

// PATCH /api/v1/admin/products/:id - update
router.patch("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    // ai_metadata is intentionally EXCLUDED - it must only be modified via
    // dedicated metadata endpoints (PATCH /admin/metadata/update/:id or generate-batch)
    // to prevent accidental overwrites of generated AI data.
    const allowedFields = ["name", "brand", "category", "description", "price", "currency", "image_url", "affiliate_url", "store_url", "primary_color", "secondary_colors", "seasons", "occasions", "styles", "materials", "fit", "formality", "is_published"];

    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        const val = ["secondary_colors", "seasons", "occasions", "styles", "materials"].includes(field)
          ? JSON.stringify(req.body[field])
          : typeof req.body[field] === "string" ? req.body[field].trim() : req.body[field];
        sets.push(`${field} = $${idx}`);
        vals.push(val);
        idx++;
      }
    }

    if (sets.length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update." });
    }

    // Update slug if name changed
    if (req.body.name) {
      const slug = req.body.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
      sets.push(`slug = $${idx}`);
      vals.push(slug);
      idx++;
    }

    vals.push(req.params.id);
    const q = await db.query(
      `UPDATE products SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
      vals
    );

    if (q.rows.length === 0) return res.status(404).json({ success: false, message: "Product not found." });
    invalidateProductsCache();
    return res.json(q.rows[0]);
  } catch (err: any) {
    console.error("[admin/products] PATCH /:id error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to update product." });
  }
});

// DELETE /api/v1/admin/products/:id
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Clean up wardrobe references to prevent orphan records
    await db.query("DELETE FROM wardrobe_items WHERE product_id = $1", [req.params.id]);

    const q = await db.query("DELETE FROM products WHERE id = $1 RETURNING id", [req.params.id]);
    if (q.rows.length === 0) return res.status(404).json({ success: false, message: "Product not found." });
    invalidateProductsCache();
    return res.json({ success: true });
  } catch (err: any) {
    console.error("[admin/products] DELETE /:id error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to delete product." });
  }
});

// POST /api/v1/admin/products/:id/generate-metadata - AI metadata generation
router.post("/:id/generate-metadata", async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Fetch the product
    const q = await db.query("SELECT name, brand, category, image_url, primary_color, description FROM products WHERE id = $1", [req.params.id]);
    if (q.rows.length === 0) return res.status(404).json({ success: false, message: "Product not found." });

    const product = q.rows[0];
    const result = await generateProductMetadata({
      name: product.name,
      brand: product.brand,
      category: product.category,
      image_url: product.image_url,
      primary_color: product.primary_color,
      description: product.description,
    });

    if (!result.success || !result.metadata) {
      return res.status(502).json({
        success: false,
        message: result.error || "AI metadata generation failed.",
        provider: result.provider,
        duration_ms: result.duration_ms,
      });
    }

    // Store the metadata on the product (admin can review before publishing)
    await db.query(
      "UPDATE products SET ai_metadata = $1, primary_color = COALESCE(NULLIF(primary_color, ''), $2) WHERE id = $3",
      [JSON.stringify(result.metadata), result.metadata.primary_color, req.params.id]
    );

    return res.json({
      success: true,
      metadata: result.metadata,
      provider: result.provider,
      duration_ms: result.duration_ms,
    });
  } catch (err: any) {
    console.error("[admin/products] generate-metadata error:", err.message);
    return res.status(500).json({ success: false, message: "Metadata generation failed." });
  }
});

export default router;
