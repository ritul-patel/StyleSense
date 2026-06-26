import { Router, type Response } from "express";
import multer from "multer";
import * as db from "../utils/db";
import { adminMiddleware } from "../middleware/adminAuth";
import type { AuthenticatedRequest } from "../middleware/auth";
import { uploadProductImage, slugFromFilename } from "../services/storageService";

const router = Router();
router.use(adminMiddleware);

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (_req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, and WebP images are allowed."));
  },
});

// POST /api/v1/admin/images/upload — upload single image
router.post("/upload", upload.single("image"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image file provided." });

    const result = await uploadProductImage(req.file.buffer, req.file.originalname, req.file.mimetype);
    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error || "Upload failed." });
    }

    return res.json({
      success: true,
      url: result.publicUrl,
      path: result.path,
      slug: slugFromFilename(req.file.originalname),
    });
  } catch (err: any) {
    console.error("[admin/images] upload error:", err.message);
    return res.status(500).json({ success: false, message: "Upload failed." });
  }
});

// POST /api/v1/admin/images/upload-batch — upload multiple images
router.post("/upload-batch", upload.array("images", 50), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) return res.status(400).json({ success: false, message: "No files provided." });

    const results: { filename: string; slug: string; url?: string; error?: string; matched?: boolean; productId?: string }[] = [];

    for (const file of files) {
      const uploadResult = await uploadProductImage(file.buffer, file.originalname, file.mimetype);
      const slug = slugFromFilename(file.originalname);

      if (!uploadResult.success) {
        results.push({ filename: file.originalname, slug, error: uploadResult.error });
        continue;
      }

      // Try to auto-match to a product by slug
      const matchQ = await db.query("SELECT id FROM products WHERE slug = $1", [slug]);
      let matched = false;
      let productId: string | undefined;

      if (matchQ.rows.length > 0) {
        productId = matchQ.rows[0].id;
        await db.query("UPDATE products SET image_url = $1 WHERE id = $2", [uploadResult.publicUrl, productId]);
        matched = true;
      }

      results.push({ filename: file.originalname, slug, url: uploadResult.publicUrl, matched, productId });
    }

    const uploaded = results.filter((r) => r.url).length;
    const matchedCount = results.filter((r) => r.matched).length;
    const failed = results.filter((r) => r.error).length;

    return res.json({
      success: true,
      total: files.length,
      uploaded,
      matched: matchedCount,
      unmatched: uploaded - matchedCount,
      failed,
      results,
    });
  } catch (err: any) {
    console.error("[admin/images] batch upload error:", err.message);
    return res.status(500).json({ success: false, message: "Batch upload failed." });
  }
});

// POST /api/v1/admin/images/match — manually match an image URL to a product
router.post("/match", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, imageUrl } = req.body;
    if (!productId || !imageUrl) return res.status(400).json({ success: false, message: "productId and imageUrl required." });

    const q = await db.query("UPDATE products SET image_url = $1 WHERE id = $2 RETURNING id", [imageUrl, productId]);
    if (q.rows.length === 0) return res.status(404).json({ success: false, message: "Product not found." });

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Match failed." });
  }
});

export default router;
