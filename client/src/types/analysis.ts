// Client-side mirror of server/src/types/analysis.ts
// Do not diverge — these two files must stay in sync.

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
}

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
