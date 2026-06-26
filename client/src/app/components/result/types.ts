export type RgbTuple = [number, number, number];

export type PaletteItem = {
  name?: string;
  hex: string;
  why?: string;
  usage?: string;
  group?: "neutrals" | "statement" | "everyday" | "accent";
};

export type AvoidColorItem = {
  name?: string;
  hex: string;
  reason?: string;
  effect?: string;
};

export type OutfitItem = {
  title: string;
  description: string;
  colors?: string[];
  occasion?: string;
  category?: string;
  season_suitability?: string;
};

export type MaterialItem = {
  name: string;
  finish?: string;
  note?: string;
};

export type AccessoryItem = {
  type: string;
  value: string;
  note?: string;
};

export type ConfidenceReasonData = {
  undertone?: string;
  contrast?: string;
  brightness?: string;
  facial_harmony?: string;
};

export type SignatureColorItem = {
  name: string;
  hex: string;
  reason: string;
};

export type AnalysisResultData = {
  skin_tone: string;
  undertone: string;
  season: string;
  confidence: number;
  rgb: RgbTuple;
  hex: string;
  best_colors: PaletteItem[];
  avoid_colors: AvoidColorItem[];
  outfits: OutfitItem[];
  style_rules: string[];
  season_explanation: string;
  materials: MaterialItem[];
  accessories: AccessoryItem[];
  palette?: PaletteItem[];
  confidence_reason?: ConfidenceReasonData;
  signature_colors?: SignatureColorItem[];
  skin_description?: string;
  next_steps?: string[];
};

// Legacy compat (used by older parsing code)
export type OutfitInput = string | { title?: string; description?: string; colors?: string[]; occasion?: string; category?: string; season_suitability?: string };
