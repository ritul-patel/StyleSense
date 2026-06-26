import { Router, type Request, type Response } from "express";
import * as db from "../utils/db";

const router = Router();

// GET /api/v1/products — public: returns only published products
router.get("/", async (req: Request, res: Response) => {
  try {
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));

    let where = "WHERE is_published = true";
    const params: any[] = [];
    let idx = 1;

    if (category) {
      params.push(category);
      where += ` AND category = $${idx}`;
      idx++;
    }

    params.push(limit);
    const q = await db.query(
      `SELECT id, name, slug, brand, category, price, currency, image_url, affiliate_url, store_url, primary_color, secondary_colors, seasons, occasions, styles, materials, fit, formality
       FROM products ${where} ORDER BY created_at DESC LIMIT $${idx}`,
      params
    );

    return res.json(q.rows);
  } catch (err: any) {
    console.error("[products] GET / error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch products." });
  }
});

export default router;
