/**
 * StyleSense Recommendation Intelligence Engine
 *
 * Metadata-driven product scoring. Works entirely from database product metadata
 * and user analysis profile. No hardcoded color rules in UI.
 *
 * Architecture:
 *   UserProfile + Product[] → Scorers[] → ScoredProduct[] → Explanation
 *
 * Used by: Result Page, Discover, Wardrobe, Outfit Builder
 */

import * as db from "../utils/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserStyleProfile {
  skin_tone: string;
  undertone: string;         // "warm" | "cool" | "neutral"
  season: string;            // "Spring" | "Summer" | "Autumn" | "Winter"
  best_colors: string[];     // Color names from analysis
  avoid_colors: string[];    // Color names to avoid
  confidence: number;        // 0–100
}

export interface ProductMetadata {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  image_url: string;
  primary_color: string;
  secondary_colors: string[];
  seasons: string[];
  occasions: string[];
  styles: string[];
  materials: string[];
  fit: string;
  formality: string;
  ai_metadata: Record<string, any> | null;
}

export interface ScoredProduct {
  product: ProductMetadata;
  score: number;             // 0–100
  reasons: string[];         // Human-readable positive factors
  negatives: string[];       // Negative factors
  breakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  color: number;
  season: number;
  undertone: number;
  occasion: number;
  style: number;
  material: number;
  formality: number;
  confidence_adj: number;
  total: number;
}

// ─── Color Matching Utilities ─────────────────────────────────────────────────

const COLOR_FAMILIES: Record<string, string[]> = {
  warm: ["beige", "brown", "tan", "rust", "terracotta", "amber", "copper", "gold", "mustard", "olive", "khaki", "peach", "coral", "orange", "cream", "sand", "camel", "mocha"],
  cool: ["navy", "blue", "cobalt", "teal", "indigo", "lavender", "purple", "plum", "mauve", "silver", "grey", "charcoal", "slate", "ice", "sky", "royal", "emerald"],
  neutral: ["black", "white", "ivory", "grey", "gray", "charcoal", "navy", "denim", "taupe"],
};

const SEASON_COLORS: Record<string, string[]> = {
  spring: ["coral", "peach", "warm pink", "golden", "light green", "turquoise", "ivory", "camel", "salmon", "apricot"],
  summer: ["lavender", "soft pink", "powder blue", "mauve", "silver", "soft white", "rose", "periwinkle", "slate"],
  autumn: ["rust", "olive", "mustard", "terracotta", "brown", "forest", "copper", "amber", "burnt orange", "moss", "khaki"],
  winter: ["black", "white", "navy", "royal blue", "emerald", "ruby", "true red", "cobalt", "magenta", "bright"],
};

const COLOR_SYNONYMS: Record<string, string[]> = {
  beige: ["cream", "sand", "tan", "khaki", "nude", "off-white"],
  brown: ["chocolate", "coffee", "walnut", "espresso", "mocha", "rust", "camel"],
  maroon: ["burgundy", "wine", "oxblood", "crimson"],
  navy: ["navy blue", "dark blue", "indigo"],
  black: ["charcoal", "ebony", "jet", "onyx"],
  white: ["ivory", "snow", "pearl", "cream", "off-white"],
  green: ["olive", "sage", "forest", "emerald", "moss", "hunter", "khaki"],
  blue: ["cobalt", "royal", "sky", "azure", "teal", "cerulean", "denim"],
  red: ["scarlet", "ruby", "crimson", "cherry", "garnet"],
  orange: ["rust", "terracotta", "amber", "copper", "peach", "burnt orange"],
  mustard: ["gold", "golden", "amber", "ochre", "honey"],
  grey: ["gray", "silver", "ash", "slate", "charcoal", "pewter"],
  pink: ["rose", "blush", "coral", "salmon", "raspberry", "fuchsia"],
  purple: ["plum", "lavender", "violet", "mauve", "amethyst", "lilac"],
};

function normalize(s: string): string {
  return (s || "").toLowerCase().trim().replace(/[-_]/g, " ");
}

function fuzzyColorMatch(color1: string, color2: string): boolean {
  const a = normalize(color1);
  const b = normalize(color2);
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  for (const [, synonyms] of Object.entries(COLOR_SYNONYMS)) {
    const aMatch = synonyms.some((s) => a.includes(s)) || Object.keys(COLOR_SYNONYMS).some((k) => a.includes(k) && synonyms === COLOR_SYNONYMS[k]);
    const bMatch = synonyms.some((s) => b.includes(s)) || Object.keys(COLOR_SYNONYMS).some((k) => b.includes(k) && synonyms === COLOR_SYNONYMS[k]);
    if (aMatch && bMatch) return true;
  }
  return false;
}

function colorBelongsToFamily(color: string, family: "warm" | "cool" | "neutral"): boolean {
  const c = normalize(color);
  return COLOR_FAMILIES[family]?.some((f) => c.includes(f)) ?? false;
}

// ─── Individual Scorers ───────────────────────────────────────────────────────

function scoreColor(product: ProductMetadata, profile: UserStyleProfile): { score: number; reasons: string[]; negatives: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const negatives: string[] = [];
  const pc = normalize(product.primary_color);
  if (!pc) return { score: 0, reasons: [], negatives: [] };

  // Match against best colors
  for (const bc of profile.best_colors) {
    if (fuzzyColorMatch(pc, bc)) {
      score += 35;
      reasons.push(`${product.primary_color} matches your ${bc} palette`);
      break;
    }
  }

  // Check secondary colors
  const secondaryArr = Array.isArray(product.secondary_colors) ? product.secondary_colors : [];
  for (const sc of secondaryArr) {
    for (const bc of profile.best_colors) {
      if (fuzzyColorMatch(sc, bc)) { score += 10; break; }
    }
  }

  // Penalty for avoid colors
  for (const ac of profile.avoid_colors) {
    if (fuzzyColorMatch(pc, ac)) {
      score -= 25;
      negatives.push(`${product.primary_color} is in your avoid list`);
      break;
    }
  }

  // Neutral bonus (always safe)
  if (colorBelongsToFamily(pc, "neutral") && score === 0) {
    score += 15;
    reasons.push("Neutral color complements any palette");
  }

  return { score: Math.max(0, Math.min(40, score)), reasons, negatives };
}

function scoreSeason(product: ProductMetadata, profile: UserStyleProfile): { score: number; reasons: string[] } {
  const productSeasons = Array.isArray(product.seasons) ? product.seasons.map(normalize) : [];
  const userSeason = normalize(profile.season);
  if (!userSeason || productSeasons.length === 0) {
    // Fallback: check if product color matches season palette
    const pc = normalize(product.primary_color);
    const seasonColors = SEASON_COLORS[userSeason] || [];
    if (seasonColors.some((c) => pc.includes(c) || fuzzyColorMatch(pc, c))) {
      return { score: 10, reasons: [`Color aligns with ${profile.season} palette`] };
    }
    return { score: 5, reasons: [] }; // No penalty, slight base
  }

  if (productSeasons.includes(userSeason) || productSeasons.includes("all-season")) {
    return { score: 20, reasons: [`Recommended for ${profile.season}`] };
  }
  return { score: 0, reasons: [] };
}

function scoreUndertone(product: ProductMetadata, profile: UserStyleProfile): { score: number; reasons: string[] } {
  const ai = product.ai_metadata;
  if (!ai) {
    // Infer from color family
    const pc = normalize(product.primary_color);
    const undertone = normalize(profile.undertone);
    if (undertone === "warm" && colorBelongsToFamily(pc, "warm")) return { score: 15, reasons: ["Warm-toned color suits your undertone"] };
    if (undertone === "cool" && colorBelongsToFamily(pc, "cool")) return { score: 15, reasons: ["Cool-toned color suits your undertone"] };
    if (undertone === "neutral") return { score: 10, reasons: [] };
    return { score: 5, reasons: [] };
  }

  const recUndertones: string[] = Array.isArray(ai.recommended_undertones) ? ai.recommended_undertones.map(normalize) : [];
  const userUndertone = normalize(profile.undertone);
  if (recUndertones.includes(userUndertone)) {
    return { score: 20, reasons: [`AI-verified match for ${profile.undertone} undertone`] };
  }
  return { score: 5, reasons: [] };
}

function scoreOccasion(product: ProductMetadata, targetOccasion?: string): { score: number; reasons: string[] } {
  if (!targetOccasion) return { score: 5, reasons: [] };
  const productOccasions = Array.isArray(product.occasions) ? product.occasions.map(normalize) : [];
  if (productOccasions.length === 0) return { score: 5, reasons: [] };
  if (productOccasions.includes(normalize(targetOccasion))) {
    return { score: 10, reasons: [`Suitable for ${targetOccasion}`] };
  }
  return { score: 0, reasons: [] };
}

function scoreStyle(product: ProductMetadata, targetStyle?: string): { score: number; reasons: string[] } {
  if (!targetStyle) return { score: 5, reasons: [] };
  const productStyles = Array.isArray(product.styles) ? product.styles.map(normalize) : [];
  if (productStyles.includes(normalize(targetStyle))) {
    return { score: 10, reasons: [`${targetStyle} style match`] };
  }
  return { score: 3, reasons: [] };
}

function scoreMaterial(product: ProductMetadata, profile: UserStyleProfile): { score: number; reasons: string[] } {
  // Season-appropriate materials
  const season = normalize(profile.season);
  const productMaterials = Array.isArray(product.materials) ? product.materials.map(normalize) : [];
  if (productMaterials.length === 0) return { score: 5, reasons: [] };

  const summerMaterials = ["cotton", "linen", "rayon", "chambray"];
  const winterMaterials = ["wool", "cashmere", "flannel", "fleece", "corduroy"];

  if ((season === "summer" || season === "spring") && productMaterials.some((m) => summerMaterials.some((sm) => m.includes(sm)))) {
    return { score: 10, reasons: ["Lightweight fabric for warmer seasons"] };
  }
  if ((season === "winter" || season === "autumn") && productMaterials.some((m) => winterMaterials.some((wm) => m.includes(wm)))) {
    return { score: 10, reasons: ["Warm fabric for cooler seasons"] };
  }
  return { score: 5, reasons: [] };
}

function scoreFormality(product: ProductMetadata, targetFormality?: string): { score: number; reasons: string[] } {
  if (!targetFormality || !product.formality) return { score: 5, reasons: [] };
  if (normalize(product.formality) === normalize(targetFormality)) {
    return { score: 10, reasons: [`${targetFormality} formality match`] };
  }
  return { score: 3, reasons: [] };
}

function confidenceAdjustment(product: ProductMetadata): number {
  // Products with AI metadata get a boost (more data = better matching)
  if (product.ai_metadata && Object.keys(product.ai_metadata).length > 3) return 5;
  return 0;
}

// ─── Main Scoring Function ────────────────────────────────────────────────────

export function scoreProduct(
  product: ProductMetadata,
  profile: UserStyleProfile,
  options: { occasion?: string; style?: string; formality?: string } = {}
): ScoredProduct {
  const color = scoreColor(product, profile);
  const season = scoreSeason(product, profile);
  const undertone = scoreUndertone(product, profile);
  const occasion = scoreOccasion(product, options.occasion);
  const style = scoreStyle(product, options.style);
  const material = scoreMaterial(product, profile);
  const formality = scoreFormality(product, options.formality);
  const confAdj = confidenceAdjustment(product);

  const total = color.score + season.score + undertone.score + occasion.score + style.score + material.score + formality.score + confAdj;
  const maxPossible = 40 + 20 + 20 + 10 + 10 + 10 + 10 + 5; // 125
  const normalizedScore = Math.min(99, Math.round((total / maxPossible) * 100));

  const allReasons = [...color.reasons, ...season.reasons, ...undertone.reasons, ...occasion.reasons, ...style.reasons, ...material.reasons, ...formality.reasons];
  const allNegatives = [...color.negatives];

  return {
    product,
    score: normalizedScore,
    reasons: allReasons.slice(0, 4),
    negatives: allNegatives,
    breakdown: {
      color: color.score,
      season: season.score,
      undertone: undertone.score,
      occasion: occasion.score,
      style: style.score,
      material: material.score,
      formality: formality.score,
      confidence_adj: confAdj,
      total: normalizedScore,
    },
  };
}

// ─── Database Query + Rank ────────────────────────────────────────────────────

export async function getRecommendedProducts(
  profile: UserStyleProfile,
  options: { occasion?: string; style?: string; formality?: string; category?: string; limit?: number } = {}
): Promise<ScoredProduct[]> {
  const limit = options.limit || 20;

  // Fetch published products from DB
  let where = "WHERE is_published = true";
  const params: any[] = [];
  let idx = 1;

  if (options.category) {
    params.push(options.category);
    where += ` AND category = $${idx}`;
    idx++;
  }

  const q = await db.query(
    `SELECT id, name, brand, category, price, image_url, primary_color, secondary_colors, seasons, occasions, styles, materials, fit, formality, ai_metadata
     FROM products ${where} ORDER BY created_at DESC LIMIT 200`,
    params
  );

  // Score all products
  const scored = q.rows.map((row) => {
    const product: ProductMetadata = {
      id: row.id,
      name: row.name,
      brand: row.brand,
      category: row.category,
      price: Number(row.price),
      image_url: row.image_url,
      primary_color: row.primary_color || "",
      secondary_colors: row.secondary_colors || [],
      seasons: row.seasons || [],
      occasions: row.occasions || [],
      styles: row.styles || [],
      materials: row.materials || [],
      fit: row.fit || "",
      formality: row.formality || "",
      ai_metadata: row.ai_metadata || null,
    };
    return scoreProduct(product, profile, options);
  });

  // Sort by score descending, filter out very low scores
  scored.sort((a, b) => b.score - a.score);
  return scored.filter((s) => s.score > 10).slice(0, limit);
}

// ─── Outfit Builder ───────────────────────────────────────────────────────────

export interface RecommendedOutfit {
  top: ScoredProduct;
  bottom: ScoredProduct;
  shoes: ScoredProduct;
  totalScore: number;
  reasons: string[];
}

export async function buildOutfitRecommendations(
  profile: UserStyleProfile,
  options: { occasion?: string; limit?: number } = {}
): Promise<RecommendedOutfit[]> {
  const allScored = await getRecommendedProducts(profile, { ...options, limit: 100 });

  const tops = allScored.filter((s) => ["tshirt", "polo", "shirt", "jacket"].includes(s.product.category));
  const bottoms = allScored.filter((s) => ["jeans", "pants", "shorts"].includes(s.product.category));
  const shoes = allScored.filter((s) => ["sneakers", "boots", "shoes"].includes(s.product.category));

  if (tops.length === 0 || bottoms.length === 0) return [];

  const outfits: RecommendedOutfit[] = [];
  const maxOutfits = options.limit || 6;

  for (let i = 0; i < Math.min(tops.length, maxOutfits); i++) {
    const top = tops[i];
    const bottom = bottoms[Math.min(i, bottoms.length - 1)];
    const shoe = shoes.length > 0 ? shoes[Math.min(i, shoes.length - 1)] : undefined;

    const combinedReasons = [...new Set([...top.reasons, ...bottom.reasons])].slice(0, 3);
    const totalScore = Math.round((top.score + bottom.score + (shoe?.score || 50)) / 3);

    outfits.push({
      top,
      bottom,
      shoes: shoe || bottom, // fallback
      totalScore,
      reasons: combinedReasons.length > 0 ? combinedReasons : ["Compatible style combination"],
    });
  }

  outfits.sort((a, b) => b.totalScore - a.totalScore);
  return outfits.slice(0, maxOutfits);
}
