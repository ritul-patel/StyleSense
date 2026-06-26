/**
 * Outfit Recommendation Service
 *
 * Matches Discover outfits against a user's analysis profile.
 * Single source of truth: uses OUTFITS + OUTFIT_PRODUCTS + PRODUCTS data.
 * No separate outfit database.
 */

import { OUTFITS, type Outfit } from "@/data/outfits";
import { OUTFIT_PRODUCTS, getProductsForOutfit } from "@/data/outfitProducts";
import { PRODUCTS } from "@/data/products";
import type { AnalysisResultData, PaletteItem } from "@/app/components/result/types";

export type RecommendedOutfit = {
  outfit: Outfit;
  score: number;         // 0–100
  reason: string;        // Human-readable explanation
  matchedColors: string[]; // Color names that matched
};

// Color name synonyms for fuzzy matching
const COLOR_SYNONYMS: Record<string, string[]> = {
  beige: ["cream", "sand", "tan", "khaki", "nude"],
  brown: ["chocolate", "coffee", "walnut", "espresso", "mocha", "rust"],
  maroon: ["burgundy", "wine", "oxblood", "crimson"],
  navy: ["navy blue", "nevy blue", "dark blue", "indigo"],
  black: ["charcoal", "ebony", "jet"],
  white: ["ivory", "snow", "pearl", "cream"],
  green: ["olive", "sage", "forest", "emerald", "moss", "hunter"],
  blue: ["cobalt", "royal", "sky", "azure", "teal", "cerulean"],
  red: ["scarlet", "ruby", "crimson", "cherry"],
  orange: ["rust", "terracotta", "amber", "copper", "peach"],
  mustard: ["gold", "golden", "amber", "ochre"],
  grey: ["gray", "silver", "ash", "slate", "charcoal"],
  pink: ["rose", "blush", "coral", "salmon", "raspberry"],
  purple: ["plum", "lavender", "violet", "mauve", "amethyst"],
};

function normalizeColor(color: string): string {
  return color.toLowerCase().trim().replace(/[-_]/g, " ");
}

function colorMatches(productColor: string, targetColor: string): boolean {
  const pc = normalizeColor(productColor);
  const tc = normalizeColor(targetColor);

  // Direct match
  if (pc.includes(tc) || tc.includes(pc)) return true;

  // Synonym match
  for (const [key, synonyms] of Object.entries(COLOR_SYNONYMS)) {
    const allVariants = [key, ...synonyms];
    const pcMatch = allVariants.some((v) => pc.includes(v));
    const tcMatch = allVariants.some((v) => tc.includes(v));
    if (pcMatch && tcMatch) return true;
  }

  return false;
}

/**
 * Score an outfit against the user's analysis profile.
 * Returns 0–100 based on how well the outfit's product colors
 * align with the user's best_colors and avoid_colors.
 */
function scoreOutfit(
  outfitId: string,
  bestColors: PaletteItem[],
  avoidColors: PaletteItem[],
  season: string
): { score: number; matchedColors: string[]; reason: string } {
  const { top, bottom, shoes } = getProductsForOutfit(outfitId);
  const products = [...top, ...bottom, ...shoes.slice(0, 1)]; // Only first shoe option

  if (products.length === 0) return { score: 0, matchedColors: [], reason: "" };

  const bestColorNames = bestColors.map((c) => c.name || "").filter(Boolean);
  const avoidColorNames = avoidColors.map((c) => c.name || "").filter(Boolean);

  let matchPoints = 0;
  let avoidPenalty = 0;
  const matchedColors: string[] = [];

  for (const product of products) {
    const pc = product.color;
    if (!pc) continue;

    // Check against best colors
    for (const bc of bestColorNames) {
      if (colorMatches(pc, bc)) {
        matchPoints += 30;
        if (!matchedColors.includes(bc)) matchedColors.push(bc);
        break;
      }
    }

    // Penalize avoid colors
    for (const ac of avoidColorNames) {
      if (colorMatches(pc, ac)) {
        avoidPenalty += 15;
        break;
      }
    }
  }

  // Neutral colors (black, white, grey, navy) get a base bonus
  for (const product of products) {
    const pc = normalizeColor(product.color);
    if (["black", "white", "grey", "gray", "navy"].some((n) => pc.includes(n))) {
      matchPoints += 10;
    }
  }

  // Season bonus for warm/cool alignment
  const seasonLower = season.toLowerCase();
  if (seasonLower.includes("autumn") || seasonLower.includes("spring")) {
    for (const product of products) {
      const pc = normalizeColor(product.color);
      if (["beige", "brown", "rust", "olive", "mustard", "green", "orange"].some((c) => pc.includes(c))) {
        matchPoints += 5;
      }
    }
  } else if (seasonLower.includes("winter") || seasonLower.includes("summer")) {
    for (const product of products) {
      const pc = normalizeColor(product.color);
      if (["blue", "navy", "white", "black", "grey", "purple", "pink"].some((c) => pc.includes(c))) {
        matchPoints += 5;
      }
    }
  }

  const rawScore = Math.max(0, matchPoints - avoidPenalty);
  const score = Math.min(98, Math.round((rawScore / (products.length * 35)) * 100));

  // Generate reason
  let reason = "";
  if (matchedColors.length > 0) {
    reason = `Matches your ${matchedColors.slice(0, 3).join(", ")} palette`;
  } else if (score > 40) {
    reason = `Complements your ${season} season`;
  } else {
    reason = "Neutral combination suitable for your profile";
  }

  return { score, matchedColors, reason };
}

/**
 * Get recommended outfits ranked by match score.
 * Returns top N outfits from the Discover catalog.
 */
export function getRecommendedOutfits(
  analysis: Pick<AnalysisResultData, "best_colors" | "avoid_colors" | "season" | "undertone">,
  count = 9
): RecommendedOutfit[] {
  const results: RecommendedOutfit[] = [];

  for (const outfit of OUTFITS) {
    const { score, matchedColors, reason } = scoreOutfit(
      outfit.outfit_id,
      analysis.best_colors,
      analysis.avoid_colors,
      analysis.season
    );

    if (score > 0) {
      results.push({ outfit, score, reason, matchedColors });
    }
  }

  // Sort by score descending, take top N
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, count);
}
