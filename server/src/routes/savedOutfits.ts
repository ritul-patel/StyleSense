import { Router, type Response } from "express";
import * as db from "../utils/db";
import { authMiddleware, type AuthenticatedRequest } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

// GET /api/v1/saved-outfits - list user's saved outfits
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const q = await db.query(
      "SELECT id, outfit_id, category, created_at FROM saved_outfits WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user!.id]
    );
    return res.json(q.rows.map((r) => ({
      id: r.id,
      outfitId: r.outfit_id,
      folderId: r.category || "favorites",
      createdAt: new Date(r.created_at).getTime(),
    })));
  } catch (err: any) {
    console.error("[saved-outfits] GET / error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch saved outfits." });
  }
});

// POST /api/v1/saved-outfits - save an outfit
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { outfitId, folderId = "favorites" } = req.body;
    if (!outfitId || typeof outfitId !== "string") {
      return res.status(400).json({ success: false, message: "outfitId is required." });
    }

    const q = await db.query(
      `INSERT INTO saved_outfits (user_id, outfit_id, title, category)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, outfit_id) DO NOTHING
       RETURNING id, outfit_id, category, created_at`,
      [req.user!.id, outfitId.trim(), outfitId.trim(), folderId.trim()]
    );

    if (q.rows.length === 0) {
      // Already saved - return existing
      const existing = await db.query(
        "SELECT id, outfit_id, category, created_at FROM saved_outfits WHERE user_id = $1 AND outfit_id = $2",
        [req.user!.id, outfitId.trim()]
      );
      if (existing.rows.length > 0) {
        const r = existing.rows[0];
        return res.json({ id: r.id, outfitId: r.outfit_id, folderId: r.category, createdAt: new Date(r.created_at).getTime() });
      }
    }

    const r = q.rows[0];
    return res.status(201).json({ id: r.id, outfitId: r.outfit_id, folderId: r.category, createdAt: new Date(r.created_at).getTime() });
  } catch (err: any) {
    console.error("[saved-outfits] POST / error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to save outfit." });
  }
});

// DELETE /api/v1/saved-outfits/:outfitId - unsave an outfit
router.delete("/:outfitId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const q = await db.query(
      "DELETE FROM saved_outfits WHERE outfit_id = $1 AND user_id = $2 RETURNING id",
      [req.params.outfitId, req.user!.id]
    );
    if (q.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Saved outfit not found." });
    }
    return res.json({ success: true });
  } catch (err: any) {
    console.error("[saved-outfits] DELETE error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to remove saved outfit." });
  }
});

export default router;
