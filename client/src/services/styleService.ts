import { supabase } from "@/lib/supabase";

export type SkinTone = "light" | "medium" | "dark";
export type Undertone = "warm" | "cool" | "neutral";

export interface StyleResult {
  best_colors: string[];
  avoid_colors: string[];
  outfits: string[];
}

export interface AnalysisRecord {
  id: string;
  skin_tone: string;
  undertone: string;
  created_at?: string;
}

export interface ResultRecord extends StyleResult {
  id?: string;
  analysis_id: string;
  created_at?: string;
}

function assertSupabaseSuccess(error: { message?: string } | null, message: string) {
  if (error) {
    throw new Error(error.message || message);
  }
}

function sanitizeStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}

export async function insertAnalysis(skin_tone: string, undertone: string): Promise<AnalysisRecord> {
  const { data, error } = await supabase
    .from("analyses")
    .insert({
      skin_tone,
      undertone,
    })
    .select("id, skin_tone, undertone, created_at")
    .single();

  assertSupabaseSuccess(error, "Failed to create analysis.");

  if (!data) {
    throw new Error("Failed to create analysis.");
  }

  return {
    id: String(data.id),
    skin_tone: String(data.skin_tone),
    undertone: String(data.undertone),
    created_at: typeof data.created_at === "string" ? data.created_at : undefined,
  };
}

export async function insertResult(analysis_id: string, result: StyleResult): Promise<ResultRecord> {
  const payload = {
    analysis_id,
    best_colors: sanitizeStringArray(result.best_colors),
    avoid_colors: sanitizeStringArray(result.avoid_colors),
    outfits: sanitizeStringArray(result.outfits),
  };

  const { data, error } = await supabase
    .from("results")
    .upsert(payload, { onConflict: "analysis_id" })
    .select("id, analysis_id, best_colors, avoid_colors, outfits, created_at")
    .single();

  assertSupabaseSuccess(error, "Failed to save analysis result.");

  if (!data) {
    throw new Error("Failed to save analysis result.");
  }

  return {
    id: typeof data.id === "string" ? data.id : undefined,
    analysis_id: String(data.analysis_id),
    best_colors: sanitizeStringArray(data.best_colors),
    avoid_colors: sanitizeStringArray(data.avoid_colors),
    outfits: sanitizeStringArray(data.outfits),
    created_at: typeof data.created_at === "string" ? data.created_at : undefined,
  };
}

export async function fetchResultByAnalysisId(analysis_id: string): Promise<StyleResult> {
  const { data, error } = await supabase
    .from("results")
    .select("best_colors, avoid_colors, outfits")
    .eq("analysis_id", analysis_id)
    .maybeSingle();

  assertSupabaseSuccess(error, "Failed to fetch analysis result.");

  if (!data) {
    throw new Error("Analysis result not found.");
  }

  return {
    best_colors: sanitizeStringArray(data.best_colors),
    avoid_colors: sanitizeStringArray(data.avoid_colors),
    outfits: sanitizeStringArray(data.outfits),
  };
}

export async function getAnalysisById(analysis_id: string): Promise<AnalysisRecord | null> {
  const { data, error } = await supabase
    .from("analyses")
    .select("id, skin_tone, undertone, created_at")
    .eq("id", analysis_id)
    .maybeSingle();

  assertSupabaseSuccess(error, "Failed to fetch analysis.");

  if (!data) {
    return null;
  }

  return {
    id: String(data.id),
    skin_tone: String(data.skin_tone),
    undertone: String(data.undertone),
    created_at: typeof data.created_at === "string" ? data.created_at : undefined,
  };
}

export function getRecommendation(skinTone: string, undertone: string): StyleResult {
  const normalizedSkinTone = skinTone.trim().toLowerCase();
  const normalizedUndertone = undertone.trim().toLowerCase();

  if (normalizedSkinTone === "medium" && normalizedUndertone === "warm") {
    return {
      best_colors: ["olive", "beige"],
      avoid_colors: ["neon"],
      outfits: ["Olive shirt + beige chinos"],
    };
  }

  return {
    best_colors: ["navy", "cream"],
    avoid_colors: ["neon"],
    outfits: ["Navy overshirt + cream trousers"],
  };
}

export async function createAnalysis(skinTone: string, undertone: string): Promise<AnalysisRecord> {
  return insertAnalysis(skinTone, undertone);
}

export async function saveResult(analysisId: string, result: StyleResult): Promise<ResultRecord> {
  return insertResult(analysisId, result);
}

export async function getResult(analysisId: string): Promise<StyleResult> {
  return fetchResultByAnalysisId(analysisId);
}

export async function runStyleSenseExample(skinTone: string, undertone: string) {
  const analysis = await createAnalysis(skinTone, undertone);
  const recommendation = getRecommendation(skinTone, undertone);

  await saveResult(analysis.id, recommendation);

  const result = await getResult(analysis.id);

  return {
    analysis,
    recommendation,
    result,
  };
}

export const styleService = {
  createAnalysis,
  saveResult,
  getResult,
  getRecommendation,
  runStyleSenseExample,
};
