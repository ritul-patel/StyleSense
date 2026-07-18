import { Router, type Response } from "express";
import * as db from "../utils/db";
import { authMiddleware, type AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// All wardrobe routes require authentication
router.use(authMiddleware);

// ═══════════════════════════════════════════════════════════════════════════════
// WARDROBE ITEMS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/v1/wardrobe - all items for the authenticated user
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dbStart = Date.now();
    const q = await db.query(
      "SELECT id, product_id, collection, created_at FROM wardrobe_items WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user!.id]
    );
    const dbMs = Date.now() - dbStart;
    const authMs = (req as any)._authMs || 0;
    console.log(`[wardrobe] GET / - auth: ${authMs}ms, db: ${dbMs}ms, rows: ${q.rows.length}`);
    return res.json(q.rows.map((r) => ({
      id: r.id,
      productId: r.product_id,
      collection: r.collection,
      createdAt: new Date(r.created_at).getTime(),
    })));
  } catch (err: any) {
    console.error("[wardrobe] GET / error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch wardrobe." });
  }
});

// POST /api/v1/wardrobe - add a product
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, collection = "Wishlist" } = req.body;
    if (!productId || typeof productId !== "string") {
      return res.status(400).json({ success: false, message: "productId is required." });
    }
    const q = await db.query(
      `INSERT INTO wardrobe_items (user_id, product_id, collection)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id) DO NOTHING
       RETURNING id, product_id, collection, created_at`,
      [req.user!.id, productId.trim(), collection.trim()]
    );
    if (q.rows.length === 0) {
      // Already exists - return existing
      const existing = await db.query(
        "SELECT id, product_id, collection, created_at FROM wardrobe_items WHERE user_id = $1 AND product_id = $2",
        [req.user!.id, productId.trim()]
      );
      return res.json({ id: existing.rows[0].id, productId: existing.rows[0].product_id, collection: existing.rows[0].collection, createdAt: new Date(existing.rows[0].created_at).getTime() });
    }
    const r = q.rows[0];
    return res.status(201).json({ id: r.id, productId: r.product_id, collection: r.collection, createdAt: new Date(r.created_at).getTime() });
  } catch (err: any) {
    console.error("[wardrobe] POST / error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to add item." });
  }
});

// PATCH /api/v1/wardrobe/:id - update collection
router.patch("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { collection } = req.body;
    if (!collection || typeof collection !== "string") {
      return res.status(400).json({ success: false, message: "collection is required." });
    }
    const q = await db.query(
      "UPDATE wardrobe_items SET collection = $1 WHERE id = $2 AND user_id = $3 RETURNING id, product_id, collection, created_at",
      [collection.trim(), req.params.id, req.user!.id]
    );
    if (q.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Item not found." });
    }
    const r = q.rows[0];
    return res.json({ id: r.id, productId: r.product_id, collection: r.collection, createdAt: new Date(r.created_at).getTime() });
  } catch (err: any) {
    console.error("[wardrobe] PATCH /:id error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to update item." });
  }
});

// DELETE /api/v1/wardrobe/:id - remove by product_id (more practical for frontend)
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Support deletion by product_id or by row id (both are UUIDs)
    const identifier = req.params.id;
    const q = await db.query(
      "DELETE FROM wardrobe_items WHERE (id = $1::uuid OR product_id = $1::uuid) AND user_id = $2 RETURNING id",
      [identifier, req.user!.id]
    );
    if (q.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Item not found." });
    }
    return res.json({ success: true });
  } catch (err: any) {
    console.error("[wardrobe] DELETE /:id error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to remove item." });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CLOSET ITEMS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/v1/wardrobe/closet
router.get("/closet", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const q = await db.query(
      "SELECT id, image_url, name, category, color, created_at FROM closet_items WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user!.id]
    );
    return res.json(q.rows.map((r) => ({
      id: r.id,
      imageUrl: r.image_url,
      name: r.name,
      category: r.category,
      color: r.color || "",
      createdAt: new Date(r.created_at).getTime(),
    })));
  } catch (err: any) {
    console.error("[wardrobe] GET /closet error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch closet." });
  }
});

// POST /api/v1/wardrobe/closet
router.post("/closet", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { imageUrl, name, category = "Other", color = "" } = req.body;
    if (!imageUrl || !name) {
      return res.status(400).json({ success: false, message: "imageUrl and name are required." });
    }
    const q = await db.query(
      "INSERT INTO closet_items (user_id, image_url, name, category, color) VALUES ($1, $2, $3, $4, $5) RETURNING id, image_url, name, category, color, created_at",
      [req.user!.id, imageUrl, name.trim(), category.trim(), color.trim()]
    );
    const r = q.rows[0];
    return res.status(201).json({ id: r.id, imageUrl: r.image_url, name: r.name, category: r.category, color: r.color, createdAt: new Date(r.created_at).getTime() });
  } catch (err: any) {
    console.error("[wardrobe] POST /closet error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to add closet item." });
  }
});

// DELETE /api/v1/wardrobe/closet/:id
router.delete("/closet/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const q = await db.query(
      "DELETE FROM closet_items WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user!.id]
    );
    if (q.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Closet item not found." });
    }
    return res.json({ success: true });
  } catch (err: any) {
    console.error("[wardrobe] DELETE /closet/:id error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to remove closet item." });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// OUTFIT BUILDS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/v1/wardrobe/outfits
router.get("/outfits", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const q = await db.query(
      "SELECT id, name, product_ids, closet_item_ids, created_at FROM outfit_builds WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user!.id]
    );
    return res.json(q.rows.map((r) => ({
      id: r.id,
      name: r.name,
      productIds: r.product_ids || [],
      closetItemIds: r.closet_item_ids || [],
      createdAt: new Date(r.created_at).getTime(),
    })));
  } catch (err: any) {
    console.error("[wardrobe] GET /outfits error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch outfits." });
  }
});

// POST /api/v1/wardrobe/outfits
router.post("/outfits", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, productIds = [], closetItemIds = [] } = req.body;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ success: false, message: "name is required." });
    }
    const q = await db.query(
      "INSERT INTO outfit_builds (user_id, name, product_ids, closet_item_ids) VALUES ($1, $2, $3, $4) RETURNING id, name, product_ids, closet_item_ids, created_at",
      [req.user!.id, name.trim(), productIds, closetItemIds]
    );
    const r = q.rows[0];
    return res.status(201).json({ id: r.id, name: r.name, productIds: r.product_ids, closetItemIds: r.closet_item_ids, createdAt: new Date(r.created_at).getTime() });
  } catch (err: any) {
    console.error("[wardrobe] POST /outfits error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to save outfit." });
  }
});

// DELETE /api/v1/wardrobe/outfits/:id
router.delete("/outfits/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const q = await db.query(
      "DELETE FROM outfit_builds WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user!.id]
    );
    if (q.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Outfit not found." });
    }
    return res.json({ success: true });
  } catch (err: any) {
    console.error("[wardrobe] DELETE /outfits/:id error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to remove outfit." });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// COLLECTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/v1/wardrobe/collections
router.get("/collections", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const q = await db.query(
      "SELECT id, name, created_at FROM wardrobe_collections WHERE user_id = $1 ORDER BY created_at ASC",
      [req.user!.id]
    );
    return res.json(q.rows.map((r) => ({
      id: r.id,
      name: r.name,
      createdAt: new Date(r.created_at).getTime(),
    })));
  } catch (err: any) {
    console.error("[wardrobe] GET /collections error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch collections." });
  }
});

// POST /api/v1/wardrobe/collections
router.post("/collections", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ success: false, message: "name is required." });
    }
    const q = await db.query(
      "INSERT INTO wardrobe_collections (user_id, name) VALUES ($1, $2) ON CONFLICT (user_id, name) DO NOTHING RETURNING id, name, created_at",
      [req.user!.id, name.trim()]
    );
    if (q.rows.length === 0) {
      return res.status(409).json({ success: false, message: "Collection already exists." });
    }
    const r = q.rows[0];
    return res.status(201).json({ id: r.id, name: r.name, createdAt: new Date(r.created_at).getTime() });
  } catch (err: any) {
    console.error("[wardrobe] POST /collections error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to create collection." });
  }
});

// PATCH /api/v1/wardrobe/collections/:id
router.patch("/collections/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ success: false, message: "name is required." });
    }
    const q = await db.query(
      "UPDATE wardrobe_collections SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING id, name, created_at",
      [name.trim(), req.params.id, req.user!.id]
    );
    if (q.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Collection not found." });
    }
    const r = q.rows[0];
    return res.json({ id: r.id, name: r.name, createdAt: new Date(r.created_at).getTime() });
  } catch (err: any) {
    console.error("[wardrobe] PATCH /collections/:id error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to rename collection." });
  }
});

// DELETE /api/v1/wardrobe/collections/:id
router.delete("/collections/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Move items in this collection to Wishlist before deleting
    const col = await db.query("SELECT name FROM wardrobe_collections WHERE id = $1 AND user_id = $2", [req.params.id, req.user!.id]);
    if (col.rows.length > 0) {
      await db.query(
        "UPDATE wardrobe_items SET collection = 'Wishlist' WHERE user_id = $1 AND collection = $2",
        [req.user!.id, col.rows[0].name]
      );
    }
    const q = await db.query(
      "DELETE FROM wardrobe_collections WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user!.id]
    );
    if (q.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Collection not found." });
    }
    return res.json({ success: true });
  } catch (err: any) {
    console.error("[wardrobe] DELETE /collections/:id error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to delete collection." });
  }
});

export default router;
