import type { AnalysisResultData, OutfitInput, OutfitItem, PaletteItem, AvoidColorItem, RgbTuple, MaterialItem, AccessoryItem, SignatureColorItem, ConfidenceReasonData } from "./types";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function normalizeHex(input: string): string {
  const value = input.trim();
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toUpperCase();
  if (/^[0-9a-f]{6}$/i.test(value)) return `#${value.toUpperCase()}`;
  return "#7A7A7A";
}

function rgbToHex(rgb: RgbTuple): string {
  const [r, g, b] = rgb.map(clampChannel);
  return `#${[r, g, b].map((item) => item.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function hexToRgb(hex: string): RgbTuple {
  const normalized = normalizeHex(hex).replace("#", "");
  const value = Number.parseInt(normalized, 16);
  if (!Number.isFinite(value)) return [122, 122, 122];
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function parseRgb(input: unknown): RgbTuple {
  if (!Array.isArray(input) || input.length < 3) return [122, 122, 122];
  return [
    clampChannel(Number(input[0] ?? 122)),
    clampChannel(Number(input[1] ?? 122)),
    clampChannel(Number(input[2] ?? 122)),
  ];
}

// Handles both string[] (old) and ColorEntry[] (new) with full fields preserved
function parseColorPalette(value: unknown): PaletteItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): PaletteItem[] => {
    if (typeof item === "string" && item.trim()) {
      return [{ name: item.trim(), hex: "#808080" }];
    }
    if (isRecord(item)) {
      const hex = typeof item.hex === "string" && item.hex.trim() ? normalizeHex(item.hex) : "#808080";
      const name = typeof item.name === "string" && item.name.trim() ? item.name.trim() : undefined;
      const why = typeof item.why === "string" ? item.why : undefined;
      const usage = typeof item.usage === "string" ? item.usage : undefined;
      const group = typeof item.group === "string" ? item.group as PaletteItem["group"] : undefined;
      return [{ name, hex, why, usage, group }];
    }
    return [];
  });
}

function parseAvoidColors(value: unknown): AvoidColorItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): AvoidColorItem[] => {
    if (typeof item === "string" && item.trim()) {
      return [{ name: item.trim(), hex: "#808080" }];
    }
    if (isRecord(item)) {
      const hex = typeof item.hex === "string" && item.hex.trim() ? normalizeHex(item.hex) : "#808080";
      const name = typeof item.name === "string" && item.name.trim() ? item.name.trim() : undefined;
      const reason = typeof item.reason === "string" ? item.reason : undefined;
      const effect = typeof item.effect === "string" ? item.effect : undefined;
      return [{ name, hex, reason, effect }];
    }
    return [];
  });
}

function parseOutfits(input: unknown): OutfitItem[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((item): OutfitItem[] => {
    if (typeof item === "string" && item.trim()) {
      const [rawTitle, ...rest] = item.split(":");
      return [{ title: rawTitle?.trim() || "Look", description: rest.join(":").trim() || item.trim() }];
    }
    if (isRecord(item)) {
      const title = typeof item.title === "string" ? item.title.trim() : "";
      const description = typeof item.description === "string" ? item.description.trim() : "";
      if (!title && !description) return [];
      return [{
        title: title || "Look",
        description,
        colors: Array.isArray(item.colors) ? item.colors.filter((c): c is string => typeof c === "string") : undefined,
        occasion: typeof item.occasion === "string" ? item.occasion : undefined,
        category: typeof item.category === "string" ? item.category : undefined,
        season_suitability: typeof item.season_suitability === "string" ? item.season_suitability : undefined,
      }];
    }
    return [];
  });
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): string => {
      if (typeof item === "string") return item.trim();
      return "";
    })
    .filter((item) => item.length > 0);
}

function parseMaterials(input: unknown): MaterialItem[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((item): MaterialItem[] => {
    if (typeof item === "string" && item.trim()) return [item.trim()];
    if (isRecord(item)) {
      const name = typeof item.name === "string" ? item.name.trim() : "";
      if (!name) return [];
      return [{ name, finish: typeof item.finish === "string" ? item.finish : undefined, note: typeof item.note === "string" ? item.note : undefined }];
    }
    return [];
  });
}

function parseAccessories(input: unknown): AccessoryItem[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((item): AccessoryItem[] => {
    if (typeof item === "string" && item.trim()) return [item.trim()];
    if (isRecord(item)) {
      const type = typeof item.type === "string" ? item.type.trim() : "";
      const value = typeof item.value === "string" ? item.value.trim() : "";
      if (!type && !value) return [];
      return [{ type, value, note: typeof item.note === "string" ? item.note : undefined }];
    }
    return [];
  });
}

function parsePalette(input: unknown): PaletteItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item): PaletteItem | null => {
      if (typeof item === "string") return { hex: normalizeHex(item) };
      if (!isRecord(item)) return null;
      const hex = typeof item.hex === "string" ? normalizeHex(item.hex) : null;
      if (!hex) return null;
      const name = typeof item.name === "string" ? item.name : undefined;
      return { name, hex };
    })
    .filter((item): item is PaletteItem => item !== null);
}

function normalizeConfidence(value: unknown): number {
  const raw = Number(value);
  if (!Number.isFinite(raw)) return 0;
  if (raw <= 1) return Math.round(raw * 100);
  return Math.round(raw);
}

function tintChannel(channel: number, shift: number): number {
  return clampChannel(channel + shift);
}

function buildPaletteFromBase(hex: string, rgb: RgbTuple): PaletteItem[] {
  const safeHex = normalizeHex(hex);
  const [r, g, b] = rgb;
  return [
    { name: "Core", hex: safeHex },
    { name: "Light", hex: rgbToHex([tintChannel(r, 28), tintChannel(g, 28), tintChannel(b, 28)]) },
    { name: "Rich", hex: rgbToHex([tintChannel(r, -18), tintChannel(g, -18), tintChannel(b, -18)]) },
    { name: "Deep", hex: rgbToHex([tintChannel(r, -42), tintChannel(g, -42), tintChannel(b, -42)]) },
  ];
}

function generatePalette(hex: string): PaletteItem[] {
  const baseRgb = hexToRgb(hex);
  return buildPaletteFromBase(hex, baseRgb);
}

export function parseResultPayload(payload: unknown): AnalysisResultData {
  const raw = isRecord(payload) ? payload : {};
  const safeHex =
    typeof raw.hex === "string" && raw.hex.trim().length > 0 && raw.hex !== "#7A7A7A"
      ? normalizeHex(raw.hex)
      : "#9A796C";

  const parsedPalette = parsePalette(raw.palette);
  const palette = parsedPalette.length > 0 ? parsedPalette : generatePalette(safeHex);

  const parsedRgb = parseRgb(raw.rgb);
  const rgb = parsedRgb.length === 3 ? parsedRgb : hexToRgb(safeHex);

  const rawSeason = raw.season ?? raw.season_name ?? raw.detected_season;

  // Parse confidence_reason
  let confidence_reason: ConfidenceReasonData | undefined;
  if (isRecord(raw.confidence_reason)) {
    const cr = raw.confidence_reason;
    confidence_reason = {
      undertone: typeof cr.undertone === "string" ? cr.undertone : undefined,
      contrast: typeof cr.contrast === "string" ? cr.contrast : undefined,
      brightness: typeof cr.brightness === "string" ? cr.brightness : undefined,
      facial_harmony: typeof cr.facial_harmony === "string" ? cr.facial_harmony : undefined,
    };
  }

  // Parse signature_colors
  let signature_colors: SignatureColorItem[] | undefined;
  if (Array.isArray(raw.signature_colors)) {
    signature_colors = raw.signature_colors.flatMap((item: unknown): SignatureColorItem[] => {
      if (!isRecord(item)) return [];
      const name = typeof item.name === "string" ? item.name : "";
      const hex = typeof item.hex === "string" ? normalizeHex(item.hex) : "";
      const reason = typeof item.reason === "string" ? item.reason : "";
      if (!name || !hex) return [];
      return [{ name, hex, reason }];
    });
  }

  return {
    skin_tone: typeof raw.skin_tone === "string" && raw.skin_tone.trim() ? raw.skin_tone : "Unknown",
    undertone: typeof raw.undertone === "string" && raw.undertone.trim() ? raw.undertone : "Unknown",
    season: typeof rawSeason === "string" && rawSeason.trim() ? rawSeason : "Unknown",
    confidence: normalizeConfidence(raw.confidence),
    rgb,
    hex: safeHex,
    best_colors: parseColorPalette(raw.best_colors),
    avoid_colors: parseAvoidColors(raw.avoid_colors),
    outfits: parseOutfits(raw.outfits),
    style_rules: parseStringArray(raw.style_rules),
    season_explanation: typeof raw.season_explanation === "string" ? raw.season_explanation.trim() : "",
    materials: parseMaterials(raw.materials),
    accessories: parseAccessories(raw.accessories),
    palette,
    confidence_reason,
    signature_colors,
    skin_description: typeof raw.skin_description === "string" ? raw.skin_description.trim() : undefined,
    next_steps: parseStringArray(raw.next_steps),
  };
}

export function buildPalette(data: AnalysisResultData): PaletteItem[] {
  if (data.palette && data.palette.length > 0) {
    return data.palette.map((item) => ({
      name: item.name,
      hex: normalizeHex(item.hex),
    }));
  }
  const rgb = parseRgb(data.rgb);
  const hex = normalizeHex(data.hex || rgbToHex(rgb));
  return buildPaletteFromBase(hex, rgb);
}

export function formatOutfit(input: OutfitInput, index: number): { title: string; description: string } {
  if (typeof input === "string") {
    const [rawTitle, ...rest] = input.split(":");
    const title = rawTitle?.trim() || `Look ${index + 1}`;
    const description = rest.join(":").trim() || input.trim();
    return { title, description };
  }
  const title = input.title?.trim() || `Look ${index + 1}`;
  const description = input.description?.trim() || "Style recommendation tailored to your profile.";
  return { title, description };
}
