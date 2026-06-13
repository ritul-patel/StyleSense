export type RgbTuple = [number, number, number];

export type OutfitInput = string | { title?: string; description?: string };

export type PaletteItem = {
  name?: string;
  hex: string;
};

export type MaterialItem =
  | string
  | { name?: string; finish?: string; note?: string };

export type AccessoryItem =
  | string
  | { type?: string; value?: string; note?: string };

export type AnalysisResultData = {
  skin_tone: string;
  undertone: string;
  season: string;
  confidence: number;
  rgb: RgbTuple;
  hex: string;
  best_colors: PaletteItem[];
  avoid_colors: PaletteItem[];
  outfits: OutfitInput[];
  style_rules: string[];
  season_explanation: string;
  materials: MaterialItem[];
  accessories: AccessoryItem[];
  palette?: PaletteItem[];
};
