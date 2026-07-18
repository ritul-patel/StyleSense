import { Router, type Request, type Response } from "express";
import * as db from "../utils/db";

const router = Router();

// ─── Public Blog Endpoints (no auth required) ───────────────────────────────

// GET /api/v1/blog/posts - published posts (paginated)
router.get("/posts", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
    const tag = typeof req.query.tag === "string" ? req.query.tag.trim() : "";
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

    let where = "WHERE bp.status = 'published'";
    const params: any[] = [];
    let idx = 1;

    if (category) {
      params.push(category);
      where += ` AND bc.slug = $${idx++}`;
    }

    if (tag) {
      params.push(tag);
      where += ` AND EXISTS (SELECT 1 FROM blog_post_tags bpt JOIN blog_tags bt ON bpt.tag_id = bt.id WHERE bpt.post_id = bp.id AND bt.slug = $${idx++})`;
    }

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (bp.title ILIKE $${idx} OR bp.excerpt ILIKE $${idx})`;
      idx++;
    }

    const countQ = await db.query(
      `SELECT COUNT(*)::int as total FROM blog_posts bp LEFT JOIN blog_categories bc ON bp.category_id = bc.id ${where}`,
      params
    );
    const total = countQ.rows[0]?.total || 0;

    params.push(limit, offset);
    const q = await db.query(
      `SELECT bp.id, bp.title, bp.slug, bp.excerpt, bp.featured_image, bp.featured_image_alt,
              bp.published_at, bp.reading_time, bp.word_count, bp.views,
              ba.name as author_name, ba.slug as author_slug, ba.avatar_url as author_avatar,
              bc.name as category_name, bc.slug as category_slug, bc.color as category_color
       FROM blog_posts bp
       LEFT JOIN blog_authors ba ON bp.author_id = ba.id
       LEFT JOIN blog_categories bc ON bp.category_id = bc.id
       ${where}
       ORDER BY bp.published_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
    return res.json({ posts: q.rows, total, page, limit });
  } catch (err: any) {
    console.error("[blog] GET /posts error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch posts." });
  }
});

// GET /api/v1/blog/posts/:slug - single published post by slug
router.get("/posts/:slug", async (req: Request, res: Response) => {
  try {
    const q = await db.query(
      `SELECT bp.*,
              ba.name as author_name, ba.slug as author_slug, ba.avatar_url as author_avatar, ba.bio as author_bio,
              bc.name as category_name, bc.slug as category_slug, bc.color as category_color,
              COALESCE(
                (SELECT json_agg(json_build_object('name', bt.name, 'slug', bt.slug))
                 FROM blog_post_tags bpt JOIN blog_tags bt ON bpt.tag_id = bt.id
                 WHERE bpt.post_id = bp.id), '[]'
              ) as tags
       FROM blog_posts bp
       LEFT JOIN blog_authors ba ON bp.author_id = ba.id
       LEFT JOIN blog_categories bc ON bp.category_id = bc.id
       WHERE bp.slug = $1 AND bp.status = 'published'`,
      [req.params.slug]
    );

    if (q.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    // Increment view count (fire and forget)
    db.query("UPDATE blog_posts SET views = views + 1 WHERE id = $1", [q.rows[0].id]).catch(() => {});

    // Get related posts (same category, exclude current)
    const post = q.rows[0];
    let related: any[] = [];
    if (post.category_id) {
      const relQ = await db.query(
        `SELECT id, title, slug, excerpt, featured_image, published_at, reading_time
         FROM blog_posts
         WHERE category_id = $1 AND id != $2 AND status = 'published'
         ORDER BY published_at DESC LIMIT 3`,
        [post.category_id, post.id]
      );
      related = relQ.rows;
    }

    // Get prev/next posts
    const [prevQ, nextQ] = await Promise.all([
      db.query(
        `SELECT id, title, slug FROM blog_posts WHERE status = 'published' AND published_at < $1 ORDER BY published_at DESC LIMIT 1`,
        [post.published_at]
      ),
      db.query(
        `SELECT id, title, slug FROM blog_posts WHERE status = 'published' AND published_at > $1 ORDER BY published_at ASC LIMIT 1`,
        [post.published_at]
      ),
    ]);

    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
    return res.json({
      ...post,
      related,
      prev: prevQ.rows[0] || null,
      next: nextQ.rows[0] || null,
    });
  } catch (err: any) {
    console.error("[blog] GET /posts/:slug error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch post." });
  }
});

// GET /api/v1/blog/categories - all categories with post counts
router.get("/categories", async (_req: Request, res: Response) => {
  try {
    const q = await db.query(
      `SELECT bc.*,
              (SELECT COUNT(*)::int FROM blog_posts WHERE category_id = bc.id AND status = 'published') as post_count
       FROM blog_categories bc
       ORDER BY bc.sort_order, bc.name`,
      []
    );
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");
    return res.json(q.rows);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Failed to fetch categories." });
  }
});

// GET /api/v1/blog/tags - all tags
router.get("/tags", async (_req: Request, res: Response) => {
  try {
    const q = await db.query(
      `SELECT bt.*, (SELECT COUNT(*)::int FROM blog_post_tags bpt JOIN blog_posts bp ON bpt.post_id = bp.id WHERE bpt.tag_id = bt.id AND bp.status = 'published') as post_count
       FROM blog_tags bt ORDER BY bt.name`,
      []
    );
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");
    return res.json(q.rows);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Failed to fetch tags." });
  }
});

export default router;
