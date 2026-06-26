import { Router, type Response } from "express";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import * as fs from "fs/promises";
import multer from "multer";
import sharp from "sharp";
import { z } from "zod";
import * as db from "../utils/db";
import { getRecommendation, type RecommendationResult } from "../engine/recommendationEngine";
import type { AnalysisPayload, ColorEntry, AvoidColor, Outfit, Material, Accessory } from "../types/analysis";
import { uploadImage } from "../utils/cloudinary";
import { AppError } from "../utils/AppError";
import { authMiddleware, optionalAuthMiddleware, type AuthenticatedRequest } from "../middleware/auth";

const router = Router();
const execFileAsync = promisify(execFile);
const pythonScriptPath = path.resolve(__dirname, "../../python/detect.py");
const pythonBin = process.env.PYTHON_BIN || "python";
const PYTHON_TIMEOUT_MS = 25_000;
const DEFAULT_RGB: [number, number, number] = [122, 122, 122];
const DEFAULT_HEX = "#7A7A7A";

// AnalysisPayload is imported from ../types/analysis — do not redefine it here.

const manualSchema = z.object({
  skin_tone: z.string().trim().min(1),
  undertone: z.string().trim().min(1),
});

const detectSchema = z.object({
  success: z.literal(true),
  data: z.object({
    fitzpatrick_type: z.enum(["I", "II", "III", "IV", "V", "VI"]),
    fitzpatrick_desc: z.string(),
    undertone: z.string(),
    rgb: z.tuple([z.number().int(), z.number().int(), z.number().int()]),
    hex: z.string(),
    ita_angle: z.number(),
    L_star: z.number(),
    a_star: z.number(),
    b_star: z.number(),
    regions_sampled: z.number().int(),
    face_detected: z.boolean(),
    region_delta_e: z.number(),
    confidence: z.number(),
    elapsed_ms: z.number(),
  }),
});

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) return cb(null, true);
    return cb(new AppError("Invalid file type in header. Only JPEG, PNG, and WebP are allowed.", 400));
  },
});

type AnalysesCaps = { hasResult: boolean; hasUserId: boolean };
let analysesCapsCache: AnalysesCaps | null = null;

type ExecFileError = Error & {
  stdout?: string;
  stderr?: string;
  killed?: boolean;
  code?: number | string;
};

function requestId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function safeHex(input: unknown) {
  const s = typeof input === "string" ? input.trim() : "";
  if (/^#[0-9a-f]{6}$/i.test(s)) return s.toUpperCase();
  if (/^[0-9a-f]{6}$/i.test(s)) return `#${s.toUpperCase()}`;
  return DEFAULT_HEX;
}
function confPct(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n <= 1 && n >= 0) return Math.round(n * 100);
  return Math.max(0, Math.min(100, Math.round(n)));
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
function strArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

// Parse an array that may be ColorEntry[] (new) or string[] (old DB rows).
function parseColorEntries(input: unknown): ColorEntry[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((v): ColorEntry[] => {
    if (typeof v === "string" && v.trim()) {
      return [{ name: v.trim(), hex: "#808080", why: "", usage: "", group: "everyday" }];
    }
    if (typeof v === "object" && v !== null) {
      const r = v as Record<string, unknown>;
      const name = typeof r.name === "string" ? r.name.trim() : "";
      if (!name) return [];
      const validGroups = ["neutrals", "statement", "everyday", "accent"];
      return [{ name, hex: typeof r.hex === "string" ? r.hex : "#808080", why: typeof r.why === "string" ? r.why : "", usage: typeof r.usage === "string" ? r.usage : "", group: validGroups.includes(r.group as string) ? (r.group as ColorEntry["group"]) : "everyday" }];
    }
    return [];
  });
}

function parseAvoidColors(input: unknown): AvoidColor[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((v): AvoidColor[] => {
    if (typeof v === "string" && v.trim()) {
      return [{ name: v.trim(), hex: "#808080", reason: "", effect: "" }];
    }
    if (typeof v === "object" && v !== null) {
      const r = v as Record<string, unknown>;
      const name = typeof r.name === "string" ? r.name.trim() : "";
      if (!name) return [];
      return [{ name, hex: typeof r.hex === "string" ? r.hex : "#808080", reason: typeof r.reason === "string" ? r.reason : "", effect: typeof r.effect === "string" ? r.effect : "" }];
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
    if (typeof v === "object" && v !== null) {
      const r = v as Record<string, unknown>;
      const title = typeof r.title === "string" ? r.title.trim() : "";
      if (!title) return [];
      const validCategories = ["daily", "casual", "formal", "party", "summer", "winter", "minimal"];
      return [{ title, description: typeof r.description === "string" ? r.description : "", colors: Array.isArray(r.colors) ? strArray(r.colors) : [], occasion: typeof r.occasion === "string" ? r.occasion : "", category: validCategories.includes(r.category as string) ? (r.category as Outfit["category"]) : "casual", season_suitability: typeof r.season_suitability === "string" ? r.season_suitability : "" }];
    }
    return [];
  });
}

function parseMaterials(input: unknown): Material[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((v): Material[] => {
    if (typeof v !== "object" || v === null) return [];
    const r = v as Record<string, unknown>;
    const name = typeof r.name === "string" ? r.name.trim() : "";
    if (!name) return [];
    const validFinishes = ["matte", "sheen", "glossy", "textured", "any"];
    return [{ name, finish: validFinishes.includes(r.finish as string) ? (r.finish as Material["finish"]) : "any", note: typeof r.note === "string" ? r.note : "" }];
  });
}

function parseAccessories(input: unknown): Accessory[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((v): Accessory[] => {
    if (typeof v !== "object" || v === null) return [];
    const r = v as Record<string, unknown>;
    const type = typeof r.type === "string" ? r.type.trim() : "";
    if (!type) return [];
    return [{ type, value: typeof r.value === "string" ? r.value : "", note: typeof r.note === "string" ? r.note : "" }];
  });
}

function resultFromUnknown(raw: unknown): Partial<AnalysisPayload> {
  const data = typeof raw === "string" ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : raw;
  if (typeof data !== "object" || data === null) return {};
  const d = data as Record<string, unknown>;
  return {
    skin_tone: typeof d.skin_tone === "string" ? d.skin_tone : undefined,
    undertone: typeof d.undertone === "string" ? d.undertone : undefined,
    season: typeof d.season === "string" ? d.season : undefined,
    confidence: confPct(d.confidence),
    rgb: Array.isArray(d.rgb) && d.rgb.length >= 3 ? [Number(d.rgb[0]) || 0, Number(d.rgb[1]) || 0, Number(d.rgb[2]) || 0] : undefined,
    hex: safeHex(d.hex),
    best_colors: parseColorEntries(d.best_colors),
    avoid_colors: parseAvoidColors(d.avoid_colors),
    outfits: parseOutfits(d.outfits),
    style_rules: strArray(d.style_rules),
    season_explanation: typeof d.season_explanation === "string" ? d.season_explanation : undefined,
    materials: parseMaterials(d.materials),
    accessories: parseAccessories(d.accessories),
    confidence_reason: typeof d.confidence_reason === "object" && d.confidence_reason !== null ? (d.confidence_reason as any) : undefined,
    signature_colors: Array.isArray(d.signature_colors) ? (d.signature_colors as any) : undefined,
    skin_description: typeof d.skin_description === "string" ? d.skin_description : undefined,
    next_steps: Array.isArray(d.next_steps) ? (d.next_steps as any) : undefined,
  };
}
async function analysesCaps(reqId: string): Promise<AnalysesCaps> {
  if (analysesCapsCache) return analysesCapsCache;
  const q = await db.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='analyses'",
    []
  );
  const cols = new Set(q.rows.map((r) => String(r.column_name || "")));
  const hasResult = cols.has("result");
  const hasUserId = cols.has("user_id");
  console.log(`[analysis/db][${reqId}] analysesCaps — hasResult: ${hasResult} | hasUserId: ${hasUserId} | columns: [${[...cols].join(", ")}]`);
  if (!hasResult) console.warn(`[analysis/db][${reqId}] analyses.result column missing — result JSONB will NOT be saved or read. Run the schema SQL migration.`);
  // Only cache permanently when all expected columns exist.
  // If a column is missing the schema migration may not have run yet — re-check next request.
  if (hasResult && hasUserId) {
    analysesCapsCache = { hasResult, hasUserId };
  }
  return { hasResult, hasUserId };
}
async function saveAnalysis(data: AnalysisPayload, imageUrl: string, userId: string | undefined, reqId: string) {
  const caps = await analysesCaps(reqId);
  console.log(`[analysis/db][${reqId}] Saving analysis. hasResult: ${caps.hasResult} | user_id: ${userId || "anonymous"} | skin_tone: ${data.skin_tone} | season: ${data.season} | best_colors: ${data.best_colors?.length ?? 0} | outfits: ${data.outfits?.length ?? 0}`);
  const cols = ["image_url", "skin_tone", "undertone"];
  const vals: unknown[] = [imageUrl, data.skin_tone, data.undertone];
  const placeholders = ["$1", "$2", "$3"];
  if (caps.hasResult) {
    cols.push("result");
    vals.push(JSON.stringify(data));
    placeholders.push(`$${vals.length}::jsonb`);
  }
  if (caps.hasUserId && userId) {
    cols.push("user_id");
    vals.push(userId);
    placeholders.push(`$${vals.length}`);
  }
  const ins = await db.query(
    `INSERT INTO analyses (${cols.join(",")}) VALUES (${placeholders.join(",")}) RETURNING id`,
    vals as any[]
  );
  const savedId = String(ins.rows[0]?.id || "").trim();
  console.log(`[analysis/db][${reqId}] Analysis saved. analysisId: ${savedId || "none"} | user_id: ${userId || "anonymous"}`);
  return savedId;
}
async function detect(imagePath: string, reqId: string) {
  try {
    const { stdout } = await execFileAsync(pythonBin, [pythonScriptPath, imagePath], {
      timeout: PYTHON_TIMEOUT_MS,
      maxBuffer: 1024 * 1024,
      windowsHide: true,
    });
    const parsed = detectSchema.safeParse(JSON.parse(stdout || "{}"));
    if (!parsed.success) throw new AppError("Python analysis returned invalid data.", 502);
    return parsed.data.data;
  } catch (error) {
    const execError = error as ExecFileError;
    const stderr = typeof execError.stderr === "string" ? execError.stderr.trim() : "";
    const stdout = typeof execError.stdout === "string" ? execError.stdout.trim() : "";
    const detail = [execError.message, stderr, stdout].filter(Boolean).join(" | ");
    console.error(`[analysis/detect][${reqId}] ${detail || "Unknown detection failure."}`);
    if (execError.killed) {
      throw new AppError("Image analysis timed out. Please try a clearer image.", 504);
    }
    throw new AppError("Image analysis runtime failed. Please try another image.", 502);
  }
}
function buildData(detected: z.infer<typeof detectSchema>["data"], rec: RecommendationResult): AnalysisPayload {
  const hex = safeHex(rec.profile?.hex_derived || detected.hex);
  const season = rec.profile?.detected_season || "Autumn";
  // Store Fitzpatrick type in skin_tone column for DB (e.g. "Type IV")
  const skinToneLabel = `Type ${detected.fitzpatrick_type}`;
  return {
    skin_tone: skinToneLabel,
    undertone: detected.undertone,
    season,
    confidence: confPct(detected.confidence),
    rgb: detected.rgb || DEFAULT_RGB,
    hex: hex === DEFAULT_HEX ? "#9A796C" : hex,
    best_colors: Array.isArray(rec.best_colors) ? rec.best_colors : [],
    avoid_colors: Array.isArray(rec.avoid_colors) ? rec.avoid_colors : [],
    outfits: Array.isArray(rec.outfits) ? rec.outfits : [],
    style_rules: Array.isArray(rec.style_rules) ? rec.style_rules : [],
    season_explanation: rec.season_explanation || "",
    materials: Array.isArray(rec.materials) ? rec.materials : [],
    accessories: Array.isArray(rec.accessories) ? rec.accessories : [],
    confidence_reason: rec.confidence_reason,
    signature_colors: rec.signature_colors,
    skin_description: rec.skin_description,
    next_steps: rec.next_steps,
  };
}
function sendError(res: Response, statusCode: number, message: string, reqId: string) {
  return res.status(statusCode).json({ success: false, message, requestId: reqId });
}

// Map free-text skin_tone or fitzpatrick_type string to FitzpatrickType
function parseFitzpatrick(raw: string): import("../engine/recommendationEngine").FitzpatrickType {
  const s = raw.trim().toUpperCase().replace(/^TYPE\s*/, "");
  if (["I","II","III","IV","V","VI"].includes(s)) {
    return s as import("../engine/recommendationEngine").FitzpatrickType;
  }
  const lower = raw.toLowerCase();
  if (lower.includes("very pale") || lower.includes("type 1")) return "I";
  if (lower.includes("fair") || lower.includes("type 2")) return "II";
  if (lower.includes("light") || lower.includes("type 3")) return "III";
  if (lower.includes("olive") || lower.includes("medium") || lower.includes("type 4")) return "IV";
  if (lower.includes("dark brown") || lower.includes("type 5")) return "V";
  if (lower.includes("deep") || lower.includes("black") || lower.includes("type 6")) return "VI";
  return "III"; // safe default
}

router.post("/manual", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const reqId = requestId();
  try {
    const { skin_tone, undertone } = manualSchema.parse(req.body);
    const fitzType = parseFitzpatrick(skin_tone);
    const rec = await getRecommendation({
      fitzpatrick_type: fitzType,
      undertone: undertone.toLowerCase(),
      rgb: DEFAULT_RGB,
      hex: DEFAULT_HEX,
    });
    const hex = safeHex(rec.profile?.hex_derived);
    const data: AnalysisPayload = {
      skin_tone: `Type ${fitzType}`,
      undertone: undertone.toLowerCase(),
      season: rec.profile?.detected_season || "Autumn",
      confidence: confPct(rec.confidence?.score),
      rgb: DEFAULT_RGB,
      hex: hex === DEFAULT_HEX ? "#9A796C" : hex,
      best_colors: Array.isArray(rec.best_colors) ? rec.best_colors : [],
      avoid_colors: Array.isArray(rec.avoid_colors) ? rec.avoid_colors : [],
      outfits: Array.isArray(rec.outfits) ? rec.outfits : [],
      style_rules: Array.isArray(rec.style_rules) ? rec.style_rules : [],
      season_explanation: rec.season_explanation || "",
      materials: Array.isArray(rec.materials) ? rec.materials : [],
      accessories: Array.isArray(rec.accessories) ? rec.accessories : [],
      confidence_reason: rec.confidence_reason,
      signature_colors: rec.signature_colors,
      skin_description: rec.skin_description,
      next_steps: rec.next_steps,
    };
    const analysisId = await saveAnalysis(data, "manual", req.user?.id, reqId);
    return res.json({ success: true, analysisId: analysisId || null, data, requestId: reqId });
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError("Manual analysis failed.", 500);
    return sendError(res, appError.statusCode, appError.message, reqId);
  }
});

router.post("/upload", authMiddleware, upload.single("image"), async (req: AuthenticatedRequest, res: Response) => {
  const reqId = requestId();
  let tempFilePath: string | undefined;
  try {
    const requestStartedAt = Date.now();
    if (!req.file) throw new AppError("No image file provided.", 400);
    tempFilePath = path.resolve(req.file.path);
    const metadata = await sharp(tempFilePath).metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format as string)) {
      throw new AppError("The uploaded file is corrupt or not a valid image.", 400);
    }
    const detected = await detect(tempFilePath, reqId);
    if (!detected.face_detected) {
      throw new AppError("No face detected. Please upload a clear, front-facing photo in good lighting.", 422);
    }
    const recommendation = await getRecommendation({
      fitzpatrick_type: detected.fitzpatrick_type,
      undertone: detected.undertone,
      rgb: detected.rgb,
      hex: detected.hex,
    });
    const data = buildData(detected, recommendation);

    let imageUrl = "";
    try {
      imageUrl = await uploadImage(tempFilePath);
    } catch (error) {
      console.warn(`[analysis/upload][${reqId}] Cloudinary upload skipped: ${describeError(error)}`);
    }

    let analysisId: string | null = null;
    try {
      analysisId = (await saveAnalysis(data, imageUrl, req.user?.id, reqId)) || null;
    } catch (error) {
      console.error(`[analysis/upload][${reqId}] DB save failed`, error);
    }

    console.log(`[analysis/upload][${reqId}] success in ${Date.now() - requestStartedAt}ms | saved=${Boolean(analysisId)} | imageUploaded=${Boolean(imageUrl)}`);
    return res.json({ success: true, analysisId, data, requestId: reqId });
  } catch (error) {
    console.error(`[analysis/upload][${reqId}] fatal: ${describeError(error)}`);
    const appError = error instanceof AppError ? error : new AppError("Analysis failed. Please try again.", 500);
    return sendError(res, appError.statusCode, appError.message, reqId);
  } finally {
    if (tempFilePath) await fs.unlink(tempFilePath).catch(() => {});
  }
});

router.get("/history", optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const reqId = requestId();
  try {
    if (!req.user?.id) return res.json([]);

    const caps = await analysesCaps(reqId);

    const where = caps.hasUserId ? "WHERE user_id = $1" : "WHERE FALSE";
    const params: unknown[] = caps.hasUserId ? [req.user.id] : [];
    const fields = caps.hasResult ? "id, skin_tone, undertone, created_at, result" : "id, skin_tone, undertone, created_at";
    const sql = `SELECT ${fields} FROM analyses ${where} ORDER BY created_at DESC LIMIT 10`;
    
    const q = await db.query(sql, params);
    const payload = q.rows.map((row) => {
      const parsed = resultFromUnknown(row.result);
      let createdAtStr: string | null = null;
      if (row.created_at) {
        try {
          createdAtStr = new Date(String(row.created_at)).toISOString();
        } catch {
          createdAtStr = null;
        }
      }
      return {
        analysisId: String(row.id),
        skin_tone: typeof row.skin_tone === "string" ? row.skin_tone : parsed.skin_tone || "Unknown",
        undertone: typeof row.undertone === "string" ? row.undertone : parsed.undertone || "Unknown",
        hex: parsed.hex || DEFAULT_HEX,
        created_at: createdAtStr,
      };
    });
    return res.json(payload);
  } catch (error: any) {
    console.error(`[history][${reqId}] ${error.message || error}`);
    const appError = error instanceof AppError ? error : new AppError("Failed to fetch analysis history.", 500);
    return sendError(res, appError.statusCode, appError.message, reqId);
  }
});

router.get("/stats", optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const reqId = requestId();
  try {
    if (!req.user?.id) {
      return res.json({ most_common_skin_tone: null, most_common_undertone: null, total_analyses: 0 });
    }
    const caps = await analysesCaps(reqId);
    const params: unknown[] = [];
    const filter = caps.hasUserId ? "WHERE user_id = $1" : "";
    if (filter) params.push(req.user.id);
    const q = await db.query(
      `SELECT
         (SELECT skin_tone FROM analyses ${filter ? `${filter} AND` : "WHERE"} skin_tone IS NOT NULL AND btrim(skin_tone)<>'' GROUP BY skin_tone ORDER BY COUNT(*) DESC, skin_tone ASC LIMIT 1) AS most_common_skin_tone,
         (SELECT undertone FROM analyses ${filter ? `${filter} AND` : "WHERE"} undertone IS NOT NULL AND btrim(undertone)<>'' GROUP BY undertone ORDER BY COUNT(*) DESC, undertone ASC LIMIT 1) AS most_common_undertone,
         (SELECT COUNT(*)::int FROM analyses ${filter}) AS total_analyses`,
      params as any[]
    );
    const row = q.rows[0] || {};
    return res.json({
      most_common_skin_tone: typeof row.most_common_skin_tone === "string" ? row.most_common_skin_tone : null,
      most_common_undertone: typeof row.most_common_undertone === "string" ? row.most_common_undertone : null,
      total_analyses: Number(row.total_analyses) || 0,
    });
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError("Failed to fetch analysis stats.", 500);
    return sendError(res, appError.statusCode, appError.message, reqId);
  }
});

router.get("/result/:id", optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const reqId = requestId();
  try {
    const analysisId = String(req.params.id || "").trim();
    if (!isUuid(analysisId)) throw new AppError("Invalid analysis ID parameter.", 400);
    const caps = await analysesCaps(reqId);
    const params: unknown[] = [analysisId];
    let where = "id = $1";
    if (caps.hasUserId && req.user?.id) { params.push(req.user.id); where += ` AND user_id = $${params.length}`; }
    const fields = caps.hasResult
      ? "id,image_url,skin_tone,undertone,created_at,result"
      : "id,image_url,skin_tone,undertone,created_at";
    const q = await db.query(`SELECT ${fields} FROM analyses WHERE ${where} LIMIT 1`, params as any[]);
    if (!q.rows[0]) throw new AppError("Analysis not found.", 404);
    const row = q.rows[0];
    const parsed = resultFromUnknown(row.result);
    return res.json({
      success: true,
      analysisId: String(row.id),
      analysis: { id: String(row.id), image_url: row.image_url || null, skin_tone: row.skin_tone || parsed.skin_tone || "Unknown", undertone: row.undertone || parsed.undertone || "Unknown", created_at: row.created_at ? new Date(String(row.created_at)).toISOString() : null },
      result: { season: parsed.season || "Unspecified", confidence: parsed.confidence || 0, rgb: parsed.rgb || DEFAULT_RGB, hex: parsed.hex || DEFAULT_HEX, best_colors: parsed.best_colors || [], avoid_colors: parsed.avoid_colors || [], outfits: parsed.outfits || [], style_rules: parsed.style_rules || [], season_explanation: parsed.season_explanation || "", materials: parsed.materials || [], accessories: parsed.accessories || [] },
      requestId: reqId,
    });
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError("Failed to fetch result.", 500);
    return sendError(res, appError.statusCode, appError.message, reqId);
  }
});

router.get("/:id", optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const reqId = requestId();
  try {
    const analysisId = String(req.params.id || "").trim();
    console.log(`[analysis/fetch][${reqId}] RESULT ID: ${analysisId} | user: ${req.user?.id || "unknown"}`);
    if (!isUuid(analysisId)) throw new AppError("Invalid analysis ID parameter.", 400);
    const caps = await analysesCaps(reqId);
    const params: unknown[] = [analysisId];
    let where = "id = $1";
    if (caps.hasUserId && req.user?.id) { params.push(req.user.id); where += ` AND user_id = $${params.length}`; }
    const fields = caps.hasResult ? "id,result,skin_tone,undertone" : "id,skin_tone,undertone";
    const q = await db.query(`SELECT ${fields} FROM analyses WHERE ${where} LIMIT 1`, params as any[]);
    if (!q.rows[0]) throw new AppError("Analysis not found.", 404);
    const row = q.rows[0];
    const resultRaw = row.result;
    console.log(`[analysis/fetch][${reqId}] DB ROW — result type: ${typeof resultRaw} | result keys: [${Object.keys(resultRaw || {}).join(", ")}] | skin_tone: ${row.skin_tone} | undertone: ${row.undertone}`);
    const parsed = resultFromUnknown(resultRaw);
    console.log(`[analysis/fetch][${reqId}] PARSED — season: ${parsed.season} | confidence: ${parsed.confidence} | best_colors: ${parsed.best_colors?.length ?? 0} | outfits: ${parsed.outfits?.length ?? 0}`);
    const data: AnalysisPayload = {
      skin_tone: row.skin_tone || parsed.skin_tone || "Unknown",
      undertone: row.undertone || parsed.undertone || "Unknown",
      season: parsed.season || "Unspecified",
      confidence: parsed.confidence || 0,
      rgb: parsed.rgb || DEFAULT_RGB,
      hex: parsed.hex || DEFAULT_HEX,
      best_colors: parsed.best_colors || [],
      avoid_colors: parsed.avoid_colors || [],
      outfits: parsed.outfits || [],
      style_rules: parsed.style_rules || [],
      season_explanation: parsed.season_explanation || "",
      materials: parsed.materials || [],
      accessories: parsed.accessories || [],
    };
    console.log(`[analysis/fetch][${reqId}] Sending data — season: ${data.season} | best_colors: ${data.best_colors.length} | outfits: ${data.outfits.length}`);
    return res.json({ success: true, analysisId: String(row.id), data, requestId: reqId });
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError("Failed to fetch analysis.", 500);
    return sendError(res, appError.statusCode, appError.message, reqId);
  }
});

export default router;
