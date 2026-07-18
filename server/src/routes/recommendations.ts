import { Router, type Response } from "express";
import { optionalAuthMiddleware, type AuthenticatedRequest } from "../middleware/auth";
import { getRecommendedProducts, buildOutfitRecommendations, type UserStyleProfile } from "../services/recommendationEngine";

const router = Router();

// POST /api/v1/recommendations/products - get ranked products for a profile
router.post("/products", optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { profile, occasion, style, formality, category, limit } = req.body;

    if (!profile || !profile.season || !profile.undertone) {
      return res.status(400).json({ success: false, message: "profile with season and undertone is required." });
    }

    const userProfile: UserStyleProfile = {
      skin_tone: profile.skin_tone || "",
      undertone: profile.undertone,
      season: profile.season,
      best_colors: Array.isArray(profile.best_colors) ? profile.best_colors : [],
      avoid_colors: Array.isArray(profile.avoid_colors) ? profile.avoid_colors : [],
      confidence: Number(profile.confidence) || 0,
    };

    const results = await getRecommendedProducts(userProfile, { occasion, style, formality, category, limit });

    return res.json({
      success: true,
      count: results.length,
      products: results.map((r) => ({
        id: r.product.id,
        name: r.product.name,
        brand: r.product.brand,
        category: r.product.category,
        price: r.product.price,
        image_url: r.product.image_url,
        primary_color: r.product.primary_color,
        score: r.score,
        reasons: r.reasons,
        negatives: r.negatives,
        breakdown: r.breakdown,
      })),
    });
  } catch (err: any) {
    console.error("[recommendations] POST /products error:", err.message);
    return res.status(500).json({ success: false, message: "Recommendation failed." });
  }
});

// POST /api/v1/recommendations/outfits - get outfit combinations
router.post("/outfits", optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { profile, occasion, limit } = req.body;

    if (!profile || !profile.season || !profile.undertone) {
      return res.status(400).json({ success: false, message: "profile with season and undertone is required." });
    }

    const userProfile: UserStyleProfile = {
      skin_tone: profile.skin_tone || "",
      undertone: profile.undertone,
      season: profile.season,
      best_colors: Array.isArray(profile.best_colors) ? profile.best_colors : [],
      avoid_colors: Array.isArray(profile.avoid_colors) ? profile.avoid_colors : [],
      confidence: Number(profile.confidence) || 0,
    };

    const outfits = await buildOutfitRecommendations(userProfile, { occasion, limit });

    return res.json({
      success: true,
      count: outfits.length,
      outfits: outfits.map((o) => ({
        top: { id: o.top.product.id, name: o.top.product.name, image_url: o.top.product.image_url, score: o.top.score },
        bottom: { id: o.bottom.product.id, name: o.bottom.product.name, image_url: o.bottom.product.image_url, score: o.bottom.score },
        shoes: { id: o.shoes.product.id, name: o.shoes.product.name, image_url: o.shoes.product.image_url, score: o.shoes.score },
        totalScore: o.totalScore,
        reasons: o.reasons,
      })),
    });
  } catch (err: any) {
    console.error("[recommendations] POST /outfits error:", err.message);
    return res.status(500).json({ success: false, message: "Outfit recommendation failed." });
  }
});

export default router;
