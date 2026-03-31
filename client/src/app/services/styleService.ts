import {
  createAnalysis,
  getAnalysisById,
  getRecommendation,
  getResult as fetchResult,
  saveResult,
  type SkinTone,
  type StyleResult,
  type Undertone,
} from "@/services/styleService";

export type { SkinTone, Undertone };

export interface AnalysisResult extends StyleResult {
  skin_tone: string;
  undertone: string;
}

export interface AnalysisResponse {
  analysis_id: string;
  result: AnalysisResult;
}

export interface UploadAnalysisResponse extends AnalysisResult {
  analysis_id?: string;
}

export interface ManualInput {
  skin_tone: SkinTone;
  undertone: Undertone;
}

function sanitizeStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}

function normalizeResult(payload: unknown, skinTone = "", undertone = ""): AnalysisResult {
  const source = typeof payload === "object" && payload ? (payload as Partial<AnalysisResult>) : {};

  return {
    skin_tone: typeof source.skin_tone === "string" ? source.skin_tone : skinTone,
    undertone: typeof source.undertone === "string" ? source.undertone : undertone,
    best_colors: sanitizeStringArray(source.best_colors),
    avoid_colors: sanitizeStringArray(source.avoid_colors),
    outfits: sanitizeStringArray(source.outfits),
  };
}

export function normalizeAnalysisResult(payload: unknown): AnalysisResult {
  return normalizeResult(payload);
}

export const styleService = {
  async analyzeManual(input: ManualInput): Promise<AnalysisResponse> {
    const analysis = await createAnalysis(input.skin_tone, input.undertone);
    const recommendation = getRecommendation(input.skin_tone, input.undertone);

    await saveResult(analysis.id, recommendation);

    return {
      analysis_id: analysis.id,
      result: normalizeResult(recommendation, analysis.skin_tone, analysis.undertone),
    };
  },

  async uploadPhoto(_file: File): Promise<UploadAnalysisResponse> {
    throw new Error("Photo analysis has been removed. Use manual analysis with Supabase.");
  },

  async getResult(analysisId: string): Promise<AnalysisResult> {
    const [analysis, result] = await Promise.all([getAnalysisById(analysisId), fetchResult(analysisId)]);

    return normalizeResult(result, analysis?.skin_tone ?? "", analysis?.undertone ?? "");
  },
};

export { createAnalysis, getRecommendation, saveResult };
