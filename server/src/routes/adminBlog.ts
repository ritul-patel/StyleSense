import { Router, type Response } from "express";
import * as db from "../utils/db";
import { adminMiddleware } from "../middleware/adminAuth";
import type { AuthenticatedRequest } from "../middleware/auth";

const router = Router();
router.use(adminMiddleware);

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeSlug(text: string): string {
  return text.trim().toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 200);
}

function calculateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 230));
}

function calculateWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ─── POSTS ──────────────────────────────────────────────────────────────────

// GET /api/v1/admin/blog/posts — list all posts (paginated, filterable)
router.get("/posts", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const status = typeof req.query.status === "string" ? req.query.status : "";
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const categoryId = typeof req.query.category === "string" ? req.query.category : "";

    let where = "WHERE 1=1";
    const params: any[] = [];
    let idx = 1;

    if (status && status !== "all") {
      params.push(status);
      where += ` AND bp.status = $${idx++}`;
    } else {
      where += ` AND bp.status != 'trash'`;
    }

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (bp.title ILIKE $${idx} OR bp.body_md ILIKE $${idx})`;
      idx++;
    }

    if (categoryId) {
      params.push(categoryId);
      where += ` AND bp.category_id = $${idx++}`;
    }

    const countQ = await db.query(`SELECT COUNT(*)::int as total FROM blog_posts bp ${where}`, params);
    const total = countQ.rows[0]?.total || 0;

    params.push(limit, offset);
    const q = await db.query(
      `SELECT bp.id, bp.title, bp.slug, bp.excerpt, bp.status, bp.featured_image,
              bp.published_at, bp.scheduled_at, bp.reading_time, bp.word_count, bp.views,
              bp.created_at, bp.updated_at,
              ba.name as author_name, ba.avatar_url as author_avatar,
              bc.name as category_name, bc.slug as category_slug
       FROM blog_posts bp
       LEFT JOIN blog_authors ba ON bp.author_id = ba.id
       LEFT JOIN blog_categories bc ON bp.category_id = bc.id
       ${where}
       ORDER BY bp.updated_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    return res.json({ posts: q.rows, total, page, limit });
  } catch (err: any) {
    console.error("[admin/blog] GET /posts error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch posts." });
  }
});

// GET /api/v1/admin/blog/posts/:id — single post with full content
router.get("/posts/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const q = await db.query(
      `SELECT bp.*, 
              ba.name as author_name, 
              bc.name as category_name,
              COALESCE(
                (SELECT json_agg(json_build_object('id', bt.id, 'name', bt.name, 'slug', bt.slug))
                 FROM blog_post_tags bpt JOIN blog_tags bt ON bpt.tag_id = bt.id
                 WHERE bpt.post_id = bp.id), '[]'
              ) as tags
       FROM blog_posts bp
       LEFT JOIN blog_authors ba ON bp.author_id = ba.id
       LEFT JOIN blog_categories bc ON bp.category_id = bc.id
       WHERE bp.id = $1`,
      [req.params.id]
    );
    if (q.rows.length === 0) return res.status(404).json({ success: false, message: "Post not found." });
    return res.json(q.rows[0]);
  } catch (err: any) {
    console.error("[admin/blog] GET /posts/:id error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch post." });
  }
});

// POST /api/v1/admin/blog/posts — create post
router.post("/posts", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title, slug: customSlug, excerpt, body_md, body_html,
      featured_image, featured_image_alt, author_id, category_id,
      status, scheduled_at, meta_title, meta_description,
      canonical_url, og_image, faq_schema, tags,
    } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ success: false, message: "Title is required." });
    }

    const slug = customSlug ? makeSlug(customSlug) : makeSlug(title);
    const bodyText = body_md || "";
    const readingTime = calculateReadingTime(bodyText);
    const wordCount = calculateWordCount(bodyText);
    const publishedAt = status === "published" ? new Date().toISOString() : null;

    const q = await db.query(
      `INSERT INTO blog_posts (
        title, slug, excerpt, body_md, body_html, featured_image, featured_image_alt,
        author_id, category_id, status, published_at, scheduled_at,
        reading_time, word_count, meta_title, meta_description,
        canonical_url, og_image, faq_schema
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      RETURNING id, slug, status, created_at`,
      [
        title.trim(), slug, (excerpt || "").trim(), bodyText, (body_html || ""),
        (featured_image || ""), (featured_image_alt || ""),
        author_id || null, category_id || null,
        status || "draft", publishedAt, scheduled_at || null,
        readingTime, wordCount,
        (meta_title || ""), (meta_description || ""),
        (canonical_url || ""), (og_image || ""),
        JSON.stringify(faq_schema || []),
      ]
    );

    const post = q.rows[0];

    // Handle tags
    if (Array.isArray(tags) && tags.length > 0) {
      for (const tagId of tags) {
        await db.query(
          "INSERT INTO blog_post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [post.id, tagId]
        ).catch(() => {});
      }
    }

    return res.status(201).json({ success: true, post });
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(409).json({ success: false, message: "A post with this slug already exists." });
    }
    console.error("[admin/blog] POST /posts error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to create post." });
  }
});

// PATCH /api/v1/admin/blog/posts/:id — update post
router.patch("/posts/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const allowedFields = [
      "title", "slug", "excerpt", "body_md", "body_html",
      "featured_image", "featured_image_alt", "author_id", "category_id",
      "status", "scheduled_at", "meta_title", "meta_description",
      "canonical_url", "og_image", "faq_schema",
    ];

    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        let val = req.body[field];
        if (field === "slug") val = makeSlug(val);
        if (field === "faq_schema") val = JSON.stringify(val);
        sets.push(`${field} = $${idx++}`);
        vals.push(val);
      }
    }

    // Auto-calculate reading time and word count if body changed
    if (req.body.body_md !== undefined) {
      const readingTime = calculateReadingTime(req.body.body_md);
      const wordCount = calculateWordCount(req.body.body_md);
      sets.push(`reading_time = $${idx++}`);
      vals.push(readingTime);
      sets.push(`word_count = $${idx++}`);
      vals.push(wordCount);
    }

    // Set published_at on first publish
    if (req.body.status === "published") {
      const existing = await db.query("SELECT published_at FROM blog_posts WHERE id = $1", [id]);
      if (existing.rows[0] && !existing.rows[0].published_at) {
        sets.push(`published_at = $${idx++}`);
        vals.push(new Date().toISOString());
      }
    }

    // Increment version
    sets.push(`version = version + 1`);

    if (sets.length === 1) { // only version increment means no real changes
      return res.status(400).json({ success: false, message: "No fields to update." });
    }

    vals.push(id);
    const q = await db.query(
      `UPDATE blog_posts SET ${sets.join(", ")} WHERE id = $${idx} RETURNING id, slug, status, updated_at`,
      vals
    );

    if (q.rows.length === 0) return res.status(404).json({ success: false, message: "Post not found." });

    // Handle tags replacement
    if (Array.isArray(req.body.tags)) {
      await db.query("DELETE FROM blog_post_tags WHERE post_id = $1", [id]);
      for (const tagId of req.body.tags) {
        await db.query(
          "INSERT INTO blog_post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [id, tagId]
        ).catch(() => {});
      }
    }

    return res.json({ success: true, post: q.rows[0] });
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(409).json({ success: false, message: "Slug already in use." });
    }
    console.error("[admin/blog] PATCH /posts/:id error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to update post." });
  }
});

// DELETE /api/v1/admin/blog/posts/:id — move to trash or permanent delete
router.delete("/posts/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const permanent = req.query.permanent === "true";

    if (permanent) {
      const q = await db.query("DELETE FROM blog_posts WHERE id = $1 RETURNING id", [id]);
      if (q.rows.length === 0) return res.status(404).json({ success: false, message: "Post not found." });
    } else {
      const q = await db.query(
        "UPDATE blog_posts SET status = 'trash' WHERE id = $1 RETURNING id",
        [id]
      );
      if (q.rows.length === 0) return res.status(404).json({ success: false, message: "Post not found." });
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error("[admin/blog] DELETE /posts/:id error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to delete post." });
  }
});

// POST /api/v1/admin/blog/posts/:id/duplicate — duplicate a post as draft
router.post("/posts/:id/duplicate", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const q = await db.query("SELECT * FROM blog_posts WHERE id = $1", [req.params.id]);
    if (q.rows.length === 0) return res.status(404).json({ success: false, message: "Post not found." });

    const src = q.rows[0];
    const newSlug = `${src.slug}-copy-${Date.now().toString(36).slice(-4)}`;

    const ins = await db.query(
      `INSERT INTO blog_posts (title, slug, excerpt, body_md, body_html, featured_image,
        featured_image_alt, author_id, category_id, status, reading_time, word_count,
        meta_title, meta_description, canonical_url, og_image, faq_schema)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft',$10,$11,$12,$13,$14,$15,$16)
       RETURNING id, slug`,
      [
        `${src.title} (Copy)`, newSlug, src.excerpt, src.body_md, src.body_html,
        src.featured_image, src.featured_image_alt, src.author_id, src.category_id,
        src.reading_time, src.word_count, src.meta_title, src.meta_description,
        src.canonical_url, src.og_image, JSON.stringify(src.faq_schema || []),
      ]
    );

    return res.status(201).json({ success: true, post: ins.rows[0] });
  } catch (err: any) {
    console.error("[admin/blog] duplicate error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to duplicate post." });
  }
});

// GET /api/v1/admin/blog/stats — blog dashboard stats
router.get("/stats", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const q = await db.query(`
      SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'draft')::int as drafts,
        COUNT(*) FILTER (WHERE status = 'published')::int as published,
        COUNT(*) FILTER (WHERE status = 'scheduled')::int as scheduled,
        COUNT(*) FILTER (WHERE status = 'archived')::int as archived,
        COUNT(*) FILTER (WHERE status = 'trash')::int as trash,
        COALESCE(SUM(views), 0)::int as total_views
      FROM blog_posts
    `, []);
    return res.json(q.rows[0]);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Failed to fetch stats." });
  }
});

// ─── CATEGORIES ─────────────────────────────────────────────────────────────

router.get("/categories", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const q = await db.query(
      "SELECT *, (SELECT COUNT(*)::int FROM blog_posts WHERE category_id = blog_categories.id AND status != 'trash') as post_count FROM blog_categories ORDER BY sort_order, name",
      []
    );
    return res.json(q.rows);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Failed to fetch categories." });
  }
});

router.post("/categories", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, color } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: "Name required." });
    const slug = makeSlug(name);
    const q = await db.query(
      "INSERT INTO blog_categories (name, slug, description, color) VALUES ($1,$2,$3,$4) RETURNING *",
      [name.trim(), slug, (description || ""), (color || "#002b92")]
    );
    return res.status(201).json(q.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") return res.status(409).json({ success: false, message: "Category already exists." });
    return res.status(500).json({ success: false, message: "Failed to create category." });
  }
});

router.patch("/categories/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, color, sort_order } = req.body;
    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    if (name !== undefined) { sets.push(`name = $${idx++}`); vals.push(name.trim()); sets.push(`slug = $${idx++}`); vals.push(makeSlug(name)); }
    if (description !== undefined) { sets.push(`description = $${idx++}`); vals.push(description); }
    if (color !== undefined) { sets.push(`color = $${idx++}`); vals.push(color); }
    if (sort_order !== undefined) { sets.push(`sort_order = $${idx++}`); vals.push(Number(sort_order)); }
    if (sets.length === 0) return res.status(400).json({ success: false, message: "No fields." });
    vals.push(req.params.id);
    const q = await db.query(`UPDATE blog_categories SET ${sets.join(",")} WHERE id = $${idx} RETURNING *`, vals);
    if (q.rows.length === 0) return res.status(404).json({ success: false, message: "Not found." });
    return res.json(q.rows[0]);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Failed to update category." });
  }
});

router.delete("/categories/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.query("UPDATE blog_posts SET category_id = NULL WHERE category_id = $1", [req.params.id]);
    const q = await db.query("DELETE FROM blog_categories WHERE id = $1 RETURNING id", [req.params.id]);
    if (q.rows.length === 0) return res.status(404).json({ success: false, message: "Not found." });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Failed to delete category." });
  }
});

// ─── TAGS ───────────────────────────────────────────────────────────────────

router.get("/tags", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const q = await db.query(
      "SELECT bt.*, (SELECT COUNT(*)::int FROM blog_post_tags WHERE tag_id = bt.id) as post_count FROM blog_tags bt ORDER BY bt.name",
      []
    );
    return res.json(q.rows);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Failed to fetch tags." });
  }
});

router.post("/tags", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: "Name required." });
    const slug = makeSlug(name);
    const q = await db.query(
      "INSERT INTO blog_tags (name, slug) VALUES ($1, $2) RETURNING *",
      [name.trim(), slug]
    );
    return res.status(201).json(q.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") return res.status(409).json({ success: false, message: "Tag already exists." });
    return res.status(500).json({ success: false, message: "Failed to create tag." });
  }
});

router.delete("/tags/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const q = await db.query("DELETE FROM blog_tags WHERE id = $1 RETURNING id", [req.params.id]);
    if (q.rows.length === 0) return res.status(404).json({ success: false, message: "Not found." });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Failed to delete tag." });
  }
});

// ─── AUTHORS ────────────────────────────────────────────────────────────────

router.get("/authors", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const q = await db.query(
      "SELECT ba.*, (SELECT COUNT(*)::int FROM blog_posts WHERE author_id = ba.id AND status != 'trash') as post_count FROM blog_authors ba ORDER BY ba.name",
      []
    );
    return res.json(q.rows);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Failed to fetch authors." });
  }
});

router.post("/authors", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, bio, avatar_url, website_url, twitter_handle, user_id } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: "Name required." });
    const slug = makeSlug(name);
    const q = await db.query(
      `INSERT INTO blog_authors (name, slug, bio, avatar_url, website_url, twitter_handle, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name.trim(), slug, (bio || ""), (avatar_url || ""), (website_url || ""), (twitter_handle || ""), user_id || null]
    );
    return res.status(201).json(q.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") return res.status(409).json({ success: false, message: "Author slug already exists." });
    return res.status(500).json({ success: false, message: "Failed to create author." });
  }
});

export default router;
