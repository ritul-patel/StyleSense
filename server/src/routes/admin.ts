import { Router, type Response } from "express";
import * as db from "../utils/db";
import { adminMiddleware } from "../middleware/adminAuth";
import type { AuthenticatedRequest } from "../middleware/auth";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseServiceRoleKey } from "../config/supabase";

const router = Router();
router.use(adminMiddleware);

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// GET /api/v1/admin/stats - platform-wide statistics
router.get("/stats", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const [analyses, products, users, wardrobe] = await Promise.all([
      db.query("SELECT COUNT(*)::int as count FROM analyses", []),
      db.query("SELECT COUNT(*)::int as total, COUNT(*) FILTER (WHERE is_published) ::int as published FROM products", []),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 }),
      db.query("SELECT COUNT(*)::int as count FROM wardrobe_items", []),
    ]);

    // Get recent analyses for trend
    const recent = await db.query(
      "SELECT DATE(created_at) as date, COUNT(*)::int as count FROM analyses WHERE created_at > now() - interval '30 days' GROUP BY DATE(created_at) ORDER BY date",
      []
    );

    // Top skin tones
    const topTones = await db.query(
      "SELECT skin_tone, COUNT(*)::int as count FROM analyses WHERE skin_tone IS NOT NULL GROUP BY skin_tone ORDER BY count DESC LIMIT 5",
      []
    );

    // Top undertones
    const topUndertones = await db.query(
      "SELECT undertone, COUNT(*)::int as count FROM analyses WHERE undertone IS NOT NULL GROUP BY undertone ORDER BY count DESC LIMIT 5",
      []
    );

    return res.json({
      total_analyses: analyses.rows[0]?.count || 0,
      total_products: products.rows[0]?.total || 0,
      published_products: products.rows[0]?.published || 0,
      total_users: users.data?.users?.length ? (users.data as any).total || users.data.users.length : 0,
      total_wardrobe_items: wardrobe.rows[0]?.count || 0,
      recent_analyses: recent.rows,
      top_skin_tones: topTones.rows,
      top_undertones: topUndertones.rows,
    });
  } catch (err: any) {
    console.error("[admin/stats] error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch stats." });
  }
});

// GET /api/v1/admin/users - list users with pagination and search
router.get("/users", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const perPage = Math.min(50, Math.max(1, Number(req.query.perPage) || 20));

    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = (data.users || []).map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      role: u.app_metadata?.role || "user",
      provider: u.app_metadata?.provider || "email",
      full_name: u.user_metadata?.full_name || u.user_metadata?.name || "",
      avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture || "",
    }));

    return res.json({ users, total: (data as any).total || users.length, page, perPage });
  } catch (err: any) {
    console.error("[admin/users] error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch users." });
  }
});

// PATCH /api/v1/admin/users/:id/role - update user role
router.patch("/users/:id/role", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.body;
    if (!role || !["admin", "user"].includes(role)) {
      return res.status(400).json({ success: false, message: "role must be 'admin' or 'user'." });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(String(req.params.id), {
      app_metadata: { role },
    });

    if (error) throw error;
    return res.json({ success: true });
  } catch (err: any) {
    console.error("[admin/users] role update error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to update role." });
  }
});

export default router;
