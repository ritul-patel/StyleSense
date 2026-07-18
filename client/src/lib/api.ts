import { supabase } from "./supabase";
import type {
  AnalysisPayload,
  AnalysisHistoryItem,
  AnalysisStats,
  ColorEntry,
  AvoidColor,
  Outfit,
  Material,
  Accessory,
} from "@/types/analysis";

export type { AnalysisPayload, AnalysisHistoryItem, AnalysisStats };

export type AnalysisByIdResponse = {
  success: true;
  analysisId: string;
  data: AnalysisPayload;
};

// ─── URL ──────────────────────────────────────────────────────────────────────

function normalizeBaseUrl(value?: string): string {
  const fallback = "https://api.stylesens.in";
  const raw = (value || fallback).trim().replace(/\/api(?:\/v\d+)?\/?$/i, "");
  try {
    return new URL(raw).toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

export const API_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function getAccessToken(): Promise<string | null> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();


    if (error) {
      console.warn("[auth] Session unavailable:", error.message);
      return null;
    }

    return session?.access_token ?? null;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown auth error";

    console.warn("[auth] Session unavailable:", message);
    return null;
  }
}

export async function getAuthHeaders(input?: HeadersInit): Promise<Headers> {
  const headers = new Headers(input);
  const token = await getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

// apiFetch - single entry point for all API calls.
// Automatically attaches the auth header and resolves relative paths.
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = await getAuthHeaders(init.headers);
  const target = /^https?:\/\//i.test(path) ? path : `${API_BASE_URL}${path}`;
  return fetch(target, { ...init, headers });
}

// ─── Scalar parsers ───────────────────────────────────────────────────────────

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function parseString(v: unknown, fallback = ""): string {
  if (typeof v !== "string") return fallback;
  const t = v.trim();
  return t.length > 0 ? t : fallback;
}
function parseStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((i): i is string => typeof i === "string" && i.trim().length > 0);
}
function parseRgb(v: unknown): [number, number, number] {
  if (!Array.isArray(v) || v.length < 3) return [122, 122, 122];
  const [r, g, b] = [Number(v[0]), Number(v[1]), Number(v[2])];
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) return [122, 122, 122];
  return [Math.round(r), Math.round(g), Math.round(b)];
}
function parseConfidence(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  if (n <= 1 && n >= 0) return Math.round(n * 100);
  return Math.round(Math.max(0, Math.min(100, n)));
}
function parseHex(v: unknown): string {
  const s = parseString(v, "");
  if (/^#[0-9a-f]{6}$/i.test(s)) return s.toUpperCase();
  if (/^[0-9a-f]{6}$/i.test(s)) return `#${s.toUpperCase()}`;
  return "#7A7A7A";
}

// ─── Array parsers (handle both old string[] and new object[] from the DB) ────

function parseColorEntries(input: unknown): ColorEntry[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((v): ColorEntry[] => {
    if (typeof v === "string" && v.trim())
      return [{ name: v.trim(), hex: "#808080", why: "", usage: "", group: "everyday" }];
    if (isRecord(v)) {
      const name = parseString(v.name, "");
      if (!name) return [];
      const validGroups = ["neutrals", "statement", "everyday", "accent"];
      return [{ name, hex: parseString(v.hex, "#808080"), why: parseString(v.why), usage: parseString(v.usage), group: validGroups.includes(v.group as string) ? (v.group as ColorEntry["group"]) : "everyday" }];
    }
    return [];
  });
}

function parseAvoidColors(input: unknown): AvoidColor[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((v): AvoidColor[] => {
    if (typeof v === "string" && v.trim())
      return [{ name: v.trim(), hex: "#808080", reason: "", effect: "" }];
    if (isRecord(v)) {
      const name = parseString(v.name, "");
      if (!name) return [];
      return [{ name, hex: parseString(v.hex, "#808080"), reason: parseString(v.reason), effect: parseString(v.effect) }];
    }
    return [];
  });
}

function parseOutfits(input: unknown): Outfit[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((v): Outfit[] => {
    if (typeof v === "string" && v.trim()) {
      const [title = v.trim(), description = ""] = v.split(":").map((s) => s.trim());
      return [{ title, description, colors: [], occasion: "", category: "casual", season_suitability: "" }];
    }
    if (isRecord(v)) {
      const title = parseString(v.title, "");
      if (!title) return [];
      const validCats = ["daily", "casual", "formal", "party", "summer", "winter", "minimal"];
      return [{ title, description: parseString(v.description), colors: parseStringArray(v.colors), occasion: parseString(v.occasion), category: validCats.includes(v.category as string) ? (v.category as Outfit["category"]) : "casual", season_suitability: parseString(v.season_suitability) }];
    }
    return [];
  });
}

function parseMaterials(input: unknown): Material[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((v): Material[] => {
    if (!isRecord(v)) return [];
    const name = parseString(v.name, "");
    if (!name) return [];
    const validFinishes = ["matte", "sheen", "glossy", "textured", "any"];
    return [{ name, finish: validFinishes.includes(v.finish as string) ? (v.finish as Material["finish"]) : "any", note: parseString(v.note) }];
  });
}

function parseAccessories(input: unknown): Accessory[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((v): Accessory[] => {
    if (!isRecord(v)) return [];
    const type = parseString(v.type, "");
    if (!type) return [];
    return [{ type, value: parseString(v.value), note: parseString(v.note) }];
  });
}

function normalizeAnalysisData(raw: unknown): AnalysisPayload {
  const s = isRecord(raw) ? raw : {};
  return {
    skin_tone: parseString(s.skin_tone, "Unknown"),
    undertone: parseString(s.undertone, "Unknown"),
    season: parseString(s.season, "Unspecified"),
    confidence: parseConfidence(s.confidence),
    rgb: parseRgb(s.rgb),
    hex: parseHex(s.hex),
    best_colors: parseColorEntries(s.best_colors),
    avoid_colors: parseAvoidColors(s.avoid_colors),
    outfits: parseOutfits(s.outfits),
    style_rules: parseStringArray(s.style_rules),
    season_explanation: parseString(s.season_explanation),
    materials: parseMaterials(s.materials),
    accessories: parseAccessories(s.accessories),
  };
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function parseJsonResponse(res: Response) {
  if (!res.ok) {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.message || body?.error || `Request failed: ${res.status}`);
    }
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchAnalysisById(analysisId: string): Promise<AnalysisByIdResponse> {
  const safeId = analysisId.trim();
  if (!safeId) throw new Error("Analysis ID is required.");

  const res = await apiFetch(`/api/v1/analysis/${encodeURIComponent(safeId)}`);
  const payload = await parseJsonResponse(res);

  if (!isRecord(payload) || payload.success !== true) {
    throw new Error("Invalid analysis response.");
  }

  return {
    success: true,
    analysisId: parseString(payload.analysisId, safeId),
    data: normalizeAnalysisData(payload.data),
  };
}

export async function fetchAnalysisHistory(): Promise<AnalysisHistoryItem[]> {
  const res = await apiFetch("/api/v1/analysis/history");
  const payload = await parseJsonResponse(res);

  if (!Array.isArray(payload)) throw new Error("Invalid analysis history response.");

  return payload
    .map((item): AnalysisHistoryItem | null => {
      if (!isRecord(item)) return null;
      const analysisId = parseString(item.analysisId);
      if (!analysisId) return null;
      return {
        analysisId,
        skin_tone: parseString(item.skin_tone, "Unknown"),
        undertone: parseString(item.undertone, "Unknown"),
        hex: parseHex(item.hex),
        created_at: parseString(item.created_at, "") || null,
      };
    })
    .filter((item): item is AnalysisHistoryItem => item !== null);
}

export async function fetchAnalysisStats(): Promise<AnalysisStats> {
  const res = await apiFetch("/api/v1/analysis/stats");
  const payload = await parseJsonResponse(res);

  if (!isRecord(payload)) throw new Error("Invalid analysis stats response.");

  return {
    most_common_skin_tone: payload.most_common_skin_tone === null ? null : parseString(payload.most_common_skin_tone, "") || null,
    most_common_undertone: payload.most_common_undertone === null ? null : parseString(payload.most_common_undertone, "") || null,
    total_analyses: Number(payload.total_analyses) || 0,
  };
}
