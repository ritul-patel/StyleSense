import { Router, type Request, type Response } from "express";
import * as db from "../utils/db";
import { optionalAuthMiddleware, authMiddleware, type AuthenticatedRequest } from "../middleware/auth";
import { adminMiddleware } from "../middleware/adminAuth";

const router = Router();

// POST /api/v1/feedback — submit feedback (auth optional)
router.post("/", optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, rating, message, page, browser, device, app_version, screenshot_url, sentry_event_id } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required." });
    }

    const validTypes = ["bug", "feature", "general"];
    const feedbackType = validTypes.includes(type) ? type : "general";
    const feedbackRating = Number(rating) >= 1 && Number(rating) <= 5 ? Number(rating) : null;

    const q = await db.query(
      `INSERT INTO feedback (user_id, type, rating, message, page, browser, device, app_version, screenshot_url, sentry_event_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, created_at`,
      [
        req.user?.id || null,
        feedbackType,
        feedbackRating,
        message.trim().slice(0, 5000),
        (page || "").slice(0, 500),
        (browser || "").slice(0, 200),
        (device || "").slice(0, 200),
        (app_version || "").slice(0, 50),
        (screenshot_url || "").slice(0, 1000),
        (sentry_event_id || "").slice(0, 100),
      ]
    );

    return res.status(201).json({ success: true, id: q.rows[0].id, created_at: q.rows[0].created_at });
  } catch (err: any) {
    console.error("[feedback] POST / error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to submit feedback." });
  }
});

// ─── Admin Routes ─────────────────────────────────────────────────────────────

// GET /api/v1/feedback/admin — list all feedback (admin only)
router.get("/admin", adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
    const type = typeof req.query.type === "string" ? req.query.type.trim() : "";
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    let where = "WHERE 1=1";
    const params: any[] = [];
    let idx = 1;

    if (status) {
      params.push(status);
      where += ` AND status = $${idx}`;
      idx++;
    }
    if (type) {
      params.push(type);
      where += ` AND type = $${idx}`;
      idx++;
    }
    if (search) {
      params.push(`%${search}%`);
      where += ` AND message ILIKE $${idx}`;
      idx++;
    }

    const countQ = await db.query(`SELECT COUNT(*)::int as total FROM feedback ${where}`, params);
    const total = countQ.rows[0]?.total || 0;

    params.push(limit, offset);
    const q = await db.query(
      `SELECT id, user_id, type, rating, message, page, browser, device, app_version, screenshot_url, sentry_event_id, status, created_at
       FROM feedback ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    return res.json({ feedback: q.rows, total, page, limit });
  } catch (err: any) {
    console.error("[feedback] GET /admin error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch feedback." });
  }
});

// PATCH /api/v1/feedback/admin/:id — update feedback status (admin only)
router.patch("/admin/:id", adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ["new", "reviewing", "planned", "fixed", "closed"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(", ")}` });
    }

    const q = await db.query(
      "UPDATE feedback SET status = $1 WHERE id = $2 RETURNING id, status",
      [status, req.params.id]
    );

    if (q.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Feedback not found." });
    }

    return res.json({ success: true, id: q.rows[0].id, status: q.rows[0].status });
  } catch (err: any) {
    console.error("[feedback] PATCH /admin/:id error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to update feedback." });
  }
});

export default router;
