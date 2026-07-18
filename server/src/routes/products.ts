import { Router, type Request, type Response } from "express";
import * as db from "../utils/db";

const router = Router();

// ─── Server-side cache for published products ─────────────────────────────────
const _cache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_TTL = 30_000; // 30 seconds

function getCached(cacheKey: string): any[] | null {
  const entry = _cache.get(cacheKey);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  if (entry) _cache.delete(cacheKey);
  return null;
}

/** Call after admin product mutations to force fresh data on next request. */
export function invalidateProductsCache(): void {
  _cache.clear();
}

// GET /api/v1/products - public: returns only published products
router.get("/", async (req: Request, res: Response) => {
  try {
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
    const cacheKey = `${category}:${limit}`;

    // Check server-side cache
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`[products] cache hit (${cacheKey})`);
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=30, stale-while-revalidate=120");
      return res.json(cached);
    }

    const dbStart = Date.now();

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

    const dbMs = Date.now() - dbStart;
    console.log(`[products] GET / - db: ${dbMs}ms, rows: ${q.rows.length}`);

    // Cache the result
    _cache.set(cacheKey, { data: q.rows, timestamp: Date.now() });

    // Browser can cache for 60s, CDN for 30s (revalidate after)
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=30, stale-while-revalidate=120");
    return res.json(q.rows);
  } catch (err: any) {
    console.error("[products] GET / error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch products." });
  }
});

export default router;
