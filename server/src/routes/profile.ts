import { Router, type Response } from "express";
import * as db from "../utils/db";
import { authMiddleware, type AuthenticatedRequest } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

// GET /api/v1/profile — get current user's profile
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const authMeta = req.user!.user_metadata || {};
    const authMs = (req as any)._authMs || 0;

    // Derive name from auth metadata (Google OAuth provides full_name or name)
    const authName = authMeta.full_name || authMeta.name || "";
    const authAvatar = authMeta.avatar_url || authMeta.picture || "";

    const dbStart = Date.now();
    // Ensure profile exists — auto-populate from OAuth on first creation
    await db.query(
      `INSERT INTO profiles (id, full_name, avatar_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [userId, authName, authAvatar]
    );

    const q = await db.query(
      `SELECT full_name, avatar_url, email_notifs, marketing_notifs, analysis_reminders, is_deleted
       FROM profiles WHERE id = $1`,
      [userId]
    );
    const dbMs = Date.now() - dbStart;
    console.log(`[profile] GET / — auth: ${authMs}ms, db: ${dbMs}ms`);

    if (q.rows.length === 0) {
      return res.json({ full_name: authName, avatar_url: authAvatar, email_notifs: true, marketing_notifs: false, analysis_reminders: true });
    }

    const row = q.rows[0];
    // If full_name is empty but auth has a name, backfill it
    const effectiveName = row.full_name || authName;
    if (!row.full_name && authName) {
      await db.query(`UPDATE profiles SET full_name = $1 WHERE id = $2 AND (full_name IS NULL OR full_name = '')`, [authName, userId]);
    }

    return res.json({
      full_name: effectiveName,
      avatar_url: row.avatar_url || authAvatar,
      email_notifs: row.email_notifs ?? true,
      marketing_notifs: row.marketing_notifs ?? false,
      analysis_reminders: row.analysis_reminders ?? true,
      is_deleted: row.is_deleted ?? false,
    });
  } catch (err: any) {
    console.error("[profile] GET error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load profile." });
  }
});

// PATCH /api/v1/profile — update profile fields
router.patch("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { full_name, avatar_url, email_notifs, marketing_notifs, analysis_reminders } = req.body;

    const sets: string[] = [];
    const vals: unknown[] = [];
    let idx = 1;

    if (full_name !== undefined) { sets.push(`full_name = $${idx++}`); vals.push(String(full_name).trim().slice(0, 100)); }
    if (avatar_url !== undefined) { sets.push(`avatar_url = $${idx++}`); vals.push(String(avatar_url).trim()); }
    if (email_notifs !== undefined) { sets.push(`email_notifs = $${idx++}`); vals.push(Boolean(email_notifs)); }
    if (marketing_notifs !== undefined) { sets.push(`marketing_notifs = $${idx++}`); vals.push(Boolean(marketing_notifs)); }
    if (analysis_reminders !== undefined) { sets.push(`analysis_reminders = $${idx++}`); vals.push(Boolean(analysis_reminders)); }

    if (sets.length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update." });
    }

    vals.push(userId);
    await db.query(
      `UPDATE profiles SET ${sets.join(", ")} WHERE id = $${idx}`,
      vals
    );

    return res.json({ success: true });
  } catch (err: any) {
    console.error("[profile] PATCH error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to update profile." });
  }
});

// POST /api/v1/profile/delete — soft delete account
router.post("/delete", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Soft delete: mark profile as deleted
    await db.query(
      `UPDATE profiles SET is_deleted = true, deleted_at = now() WHERE id = $1`,
      [userId]
    );

    // Delete wardrobe data
    await db.query(`DELETE FROM wardrobe_items WHERE user_id = $1`, [userId]);
    await db.query(`DELETE FROM closet_items WHERE user_id = $1`, [userId]);
    await db.query(`DELETE FROM outfit_builds WHERE user_id = $1`, [userId]);
    await db.query(`DELETE FROM wardrobe_collections WHERE user_id = $1`, [userId]);

    return res.json({ success: true });
  } catch (err: any) {
    console.error("[profile] DELETE error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to delete account." });
  }
});

// DELETE /api/v1/profile/history — clear analysis history
router.delete("/history", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await db.query(`DELETE FROM analyses WHERE user_id = $1`, [userId]);
    return res.json({ success: true });
  } catch (err: any) {
    console.error("[profile] DELETE /history error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to clear history." });
  }
});

export default router;
