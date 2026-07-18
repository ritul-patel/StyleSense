import { Router, type Response } from "express";
import * as db from "../utils/db";
import { adminMiddleware } from "../middleware/adminAuth";
import type { AuthenticatedRequest } from "../middleware/auth";

const router = Router();
router.use(adminMiddleware);

// GET /api/v1/admin/outfits - list all outfits (paginated)
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const countQ = await db.query("SELECT COUNT(*)::int as total FROM outfit_builds", []);
    const total = countQ.rows[0]?.total || 0;

    const q = await db.query(
      "SELECT id, name, product_ids, closet_item_ids, created_at FROM outfit_builds ORDER BY created_at DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    );

    return res.json({
      outfits: q.rows.map((r) => ({
        id: r.id,
        name: r.name,
        productIds: r.product_ids || [],
        closetItemIds: r.closet_item_ids || [],
        createdAt: new Date(r.created_at).getTime(),
      })),
      total, page, limit,
    });
  } catch (err: any) {
    console.error("[admin/outfits] GET / error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch outfits." });
  }
});

// GET /api/v1/admin/outfits/:id
router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const q = await db.query("SELECT * FROM outfit_builds WHERE id = $1", [req.params.id]);
    if (q.rows.length === 0) return res.status(404).json({ success: false, message: "Outfit not found." });
    const r = q.rows[0];
    return res.json({ id: r.id, name: r.name, productIds: r.product_ids || [], closetItemIds: r.closet_item_ids || [], createdAt: new Date(r.created_at).getTime() });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Failed to fetch outfit." });
  }
});

// POST /api/v1/admin/outfits - create
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, productIds = [], closetItemIds = [] } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, message: "name is required." });
    }
    const q = await db.query(
      "INSERT INTO outfit_builds (user_id, name, product_ids, closet_item_ids) VALUES ($1, $2, $3, $4) RETURNING id, name, product_ids, closet_item_ids, created_at",
      [req.user!.id, name.trim(), productIds, closetItemIds]
    );
    const r = q.rows[0];
    return res.status(201).json({ id: r.id, name: r.name, productIds: r.product_ids, closetItemIds: r.closet_item_ids, createdAt: new Date(r.created_at).getTime() });
  } catch (err: any) {
    console.error("[admin/outfits] POST / error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to create outfit." });
  }
});

// PATCH /api/v1/admin/outfits/:id - update
router.patch("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, productIds, closetItemIds } = req.body;
    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;

    if (name !== undefined) { sets.push(`name = $${idx++}`); vals.push(String(name).trim()); }
    if (productIds !== undefined) { sets.push(`product_ids = $${idx++}`); vals.push(productIds); }
    if (closetItemIds !== undefined) { sets.push(`closet_item_ids = $${idx++}`); vals.push(closetItemIds); }

    if (sets.length === 0) return res.status(400).json({ success: false, message: "No fields to update." });

    vals.push(req.params.id);
    const q = await db.query(`UPDATE outfit_builds SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`, vals);
    if (q.rows.length === 0) return res.status(404).json({ success: false, message: "Outfit not found." });
    const r = q.rows[0];
    return res.json({ id: r.id, name: r.name, productIds: r.product_ids, closetItemIds: r.closet_item_ids });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Failed to update outfit." });
  }
});

// DELETE /api/v1/admin/outfits/:id
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const q = await db.query("DELETE FROM outfit_builds WHERE id = $1 RETURNING id", [req.params.id]);
    if (q.rows.length === 0) return res.status(404).json({ success: false, message: "Outfit not found." });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Failed to delete outfit." });
  }
});

export default router;
