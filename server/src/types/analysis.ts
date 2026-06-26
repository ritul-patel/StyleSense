// Canonical data types for StyleSense analysis.
// These types flow from the AI engine → API response → client unchanged.
// The client mirrors this file at client/src/types/analysis.ts — keep them in sync.

export interface ColorEntry {
  name: string;
  hex: string;
  why: string;
  usage: string;
  group: "neutrals" | "statement" | "everyday" | "accent";
}

export interface AvoidColor {
  name: string;
  hex: string;
  reason: string;
  effect: string;
}

export interface Outfit {
  title: string;
  description: string;
  colors: string[];
  occasion: string;
  category: "daily" | "casual" | "formal" | "party" | "summer" | "winter" | "minimal";
  season_suitability: string;
}

export interface Material {
  name: string;
  finish: "matte" | "sheen" | "glossy" | "textured" | "any";
  note: string;
}

export interface Accessory {
  type: string;
  value: string;
  note: string;
}

export interface ConfidenceReason {
  undertone: "low" | "medium" | "high";
  contrast: "low" | "medium" | "high";
  brightness: "low" | "medium" | "high";
  facial_harmony: "low" | "medium" | "high";
}

export interface SignatureColor {
  name: string;
  hex: string;
  reason: string;
}

// Full payload stored in the DB and returned by POST /upload and GET /:id.
// best_colors, avoid_colors, and outfits are always rich objects — never string[].
export interface AnalysisPayload {
  skin_tone: string;
  undertone: string;
  season: string;
  confidence: number;
  rgb: [number, number, number];
  hex: string;
  best_colors: ColorEntry[];
  avoid_colors: AvoidColor[];
  outfits: Outfit[];
  style_rules: string[];
  season_explanation: string;
  materials: Material[];
  accessories: Accessory[];
  confidence_reason?: ConfidenceReason;
  signature_colors?: SignatureColor[];
  skin_description?: string;
  next_steps?: string[];
}

// Summary row returned by GET /history — no recommendation detail.
export interface AnalysisHistoryItem {
  analysisId: string;
  skin_tone: string;
  undertone: string;
  hex: string;
  created_at: string | null;
}

export interface AnalysisStats {
  most_common_skin_tone: string | null;
  most_common_undertone: string | null;
  total_analyses: number;
}
