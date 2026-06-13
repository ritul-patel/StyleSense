"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const child_process_1 = require("child_process");
const util_1 = require("util");
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs/promises"));
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const zod_1 = require("zod");
const db = __importStar(require("../utils/db"));
const recommendationEngine_1 = require("../engine/recommendationEngine");
const cloudinary_1 = require("../utils/cloudinary");
const AppError_1 = require("../utils/AppError");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
const pythonScriptPath = path_1.default.resolve(__dirname, "../../python/detect.py");
const pythonBin = process.env.PYTHON_BIN || "python";
const PYTHON_TIMEOUT_MS = 25000;
const DEFAULT_RGB = [122, 122, 122];
const DEFAULT_HEX = "#7A7A7A";
// AnalysisPayload is imported from ../types/analysis — do not redefine it here.
const manualSchema = zod_1.z.object({
    skin_tone: zod_1.z.string().trim().min(1),
    undertone: zod_1.z.string().trim().min(1),
});
const detectSchema = zod_1.z.object({
    success: zod_1.z.literal(true),
    data: zod_1.z.object({
        fitzpatrick_type: zod_1.z.enum(["I", "II", "III", "IV", "V", "VI"]),
        fitzpatrick_desc: zod_1.z.string(),
        undertone: zod_1.z.string(),
        rgb: zod_1.z.tuple([zod_1.z.number().int(), zod_1.z.number().int(), zod_1.z.number().int()]),
        hex: zod_1.z.string(),
        ita_angle: zod_1.z.number(),
        L_star: zod_1.z.number(),
        a_star: zod_1.z.number(),
        b_star: zod_1.z.number(),
        regions_sampled: zod_1.z.number().int(),
        face_detected: zod_1.z.boolean(),
        region_delta_e: zod_1.z.number(),
        confidence: zod_1.z.number(),
        elapsed_ms: zod_1.z.number(),
    }),
});
const upload = (0, multer_1.default)({
    dest: "uploads/",
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype))
            return cb(null, true);
        return cb(new AppError_1.AppError("Invalid file type in header. Only JPEG, PNG, and WebP are allowed.", 400));
    },
});
let analysesCapsCache = null;
function requestId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function safeHex(input) {
    const s = typeof input === "string" ? input.trim() : "";
    if (/^#[0-9a-f]{6}$/i.test(s))
        return s.toUpperCase();
    if (/^[0-9a-f]{6}$/i.test(s))
        return `#${s.toUpperCase()}`;
    return DEFAULT_HEX;
}
function confPct(value) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return 0;
    if (n <= 1 && n >= 0)
        return Math.round(n * 100);
    return Math.max(0, Math.min(100, Math.round(n)));
}
function describeError(error) {
    if (error instanceof Error)
        return error.message;
    if (typeof error === "string")
        return error;
    try {
        return JSON.stringify(error);
    }
    catch (_a) {
        return String(error);
    }
}
function strArray(input) {
    if (!Array.isArray(input))
        return [];
    return input.filter((v) => typeof v === "string" && v.trim().length > 0);
}
// Parse an array that may be ColorEntry[] (new) or string[] (old DB rows).
function parseColorEntries(input) {
    if (!Array.isArray(input))
        return [];
    return input.flatMap((v) => {
        if (typeof v === "string" && v.trim()) {
            return [{ name: v.trim(), hex: "#808080", why: "", usage: "", group: "everyday" }];
        }
        if (typeof v === "object" && v !== null) {
            const r = v;
            const name = typeof r.name === "string" ? r.name.trim() : "";
            if (!name)
                return [];
            const validGroups = ["neutrals", "statement", "everyday", "accent"];
            return [{ name, hex: typeof r.hex === "string" ? r.hex : "#808080", why: typeof r.why === "string" ? r.why : "", usage: typeof r.usage === "string" ? r.usage : "", group: validGroups.includes(r.group) ? r.group : "everyday" }];
        }
        return [];
    });
}
function parseAvoidColors(input) {
    if (!Array.isArray(input))
        return [];
    return input.flatMap((v) => {
        if (typeof v === "string" && v.trim()) {
            return [{ name: v.trim(), hex: "#808080", reason: "", effect: "" }];
        }
        if (typeof v === "object" && v !== null) {
            const r = v;
            const name = typeof r.name === "string" ? r.name.trim() : "";
            if (!name)
                return [];
            return [{ name, hex: typeof r.hex === "string" ? r.hex : "#808080", reason: typeof r.reason === "string" ? r.reason : "", effect: typeof r.effect === "string" ? r.effect : "" }];
        }
        return [];
    });
}
function parseOutfits(input) {
    if (!Array.isArray(input))
        return [];
    return input.flatMap((v) => {
        if (typeof v === "string" && v.trim()) {
            const [title = v.trim(), description = ""] = v.split(":").map((s) => s.trim());
            return [{ title, description, colors: [], occasion: "", category: "casual", season_suitability: "" }];
        }
        if (typeof v === "object" && v !== null) {
            const r = v;
            const title = typeof r.title === "string" ? r.title.trim() : "";
            if (!title)
                return [];
            const validCategories = ["daily", "casual", "formal", "party", "summer", "winter", "minimal"];
            return [{ title, description: typeof r.description === "string" ? r.description : "", colors: Array.isArray(r.colors) ? strArray(r.colors) : [], occasion: typeof r.occasion === "string" ? r.occasion : "", category: validCategories.includes(r.category) ? r.category : "casual", season_suitability: typeof r.season_suitability === "string" ? r.season_suitability : "" }];
        }
        return [];
    });
}
function parseMaterials(input) {
    if (!Array.isArray(input))
        return [];
    return input.flatMap((v) => {
        if (typeof v !== "object" || v === null)
            return [];
        const r = v;
        const name = typeof r.name === "string" ? r.name.trim() : "";
        if (!name)
            return [];
        const validFinishes = ["matte", "sheen", "glossy", "textured", "any"];
        return [{ name, finish: validFinishes.includes(r.finish) ? r.finish : "any", note: typeof r.note === "string" ? r.note : "" }];
    });
}
function parseAccessories(input) {
    if (!Array.isArray(input))
        return [];
    return input.flatMap((v) => {
        if (typeof v !== "object" || v === null)
            return [];
        const r = v;
        const type = typeof r.type === "string" ? r.type.trim() : "";
        if (!type)
            return [];
        return [{ type, value: typeof r.value === "string" ? r.value : "", note: typeof r.note === "string" ? r.note : "" }];
    });
}
function resultFromUnknown(raw) {
    const data = typeof raw === "string" ? (() => { try {
        return JSON.parse(raw);
    }
    catch (_a) {
        return {};
    } })() : raw;
    if (typeof data !== "object" || data === null)
        return {};
    const d = data;
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
    };
}
function analysesCaps(reqId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (analysesCapsCache)
            return analysesCapsCache;
        const q = yield db.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='analyses'", []);
        const cols = new Set(q.rows.map((r) => String(r.column_name || "")));
        const hasResult = cols.has("result");
        const hasUserId = cols.has("user_id");
        console.log(`[analysis/db][${reqId}] analysesCaps — hasResult: ${hasResult} | hasUserId: ${hasUserId} | columns: [${[...cols].join(", ")}]`);
        if (!hasResult)
            console.warn(`[analysis/db][${reqId}] analyses.result column missing — result JSONB will NOT be saved or read. Run the schema SQL migration.`);
        // Only cache permanently when all expected columns exist.
        // If a column is missing the schema migration may not have run yet — re-check next request.
        if (hasResult && hasUserId) {
            analysesCapsCache = { hasResult, hasUserId };
        }
        return { hasResult, hasUserId };
    });
}
function saveAnalysis(data, imageUrl, userId, reqId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const caps = yield analysesCaps(reqId);
        console.log(`[analysis/db][${reqId}] Saving analysis. hasResult: ${caps.hasResult} | user_id: ${userId || "anonymous"} | skin_tone: ${data.skin_tone} | season: ${data.season} | best_colors: ${(_b = (_a = data.best_colors) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0} | outfits: ${(_d = (_c = data.outfits) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0}`);
        const cols = ["image_url", "skin_tone", "undertone"];
        const vals = [imageUrl, data.skin_tone, data.undertone];
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
        const ins = yield db.query(`INSERT INTO analyses (${cols.join(",")}) VALUES (${placeholders.join(",")}) RETURNING id`, vals);
        const savedId = String(((_e = ins.rows[0]) === null || _e === void 0 ? void 0 : _e.id) || "").trim();
        console.log(`[analysis/db][${reqId}] Analysis saved. analysisId: ${savedId || "none"} | user_id: ${userId || "anonymous"}`);
        return savedId;
    });
}
function detect(imagePath, reqId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { stdout } = yield execFileAsync(pythonBin, [pythonScriptPath, imagePath], {
                timeout: PYTHON_TIMEOUT_MS,
                maxBuffer: 1024 * 1024,
                windowsHide: true,
            });
            const parsed = detectSchema.safeParse(JSON.parse(stdout || "{}"));
            if (!parsed.success)
                throw new AppError_1.AppError("Python analysis returned invalid data.", 502);
            return parsed.data.data;
        }
        catch (error) {
            const execError = error;
            const stderr = typeof execError.stderr === "string" ? execError.stderr.trim() : "";
            const stdout = typeof execError.stdout === "string" ? execError.stdout.trim() : "";
            const detail = [execError.message, stderr, stdout].filter(Boolean).join(" | ");
            console.error(`[analysis/detect][${reqId}] ${detail || "Unknown detection failure."}`);
            if (execError.killed) {
                throw new AppError_1.AppError("Image analysis timed out. Please try a clearer image.", 504);
            }
            throw new AppError_1.AppError("Image analysis runtime failed. Please try another image.", 502);
        }
    });
}
function buildData(detected, rec) {
    var _a, _b;
    const hex = safeHex(((_a = rec.profile) === null || _a === void 0 ? void 0 : _a.hex_derived) || detected.hex);
    const season = ((_b = rec.profile) === null || _b === void 0 ? void 0 : _b.detected_season) || "Autumn";
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
    };
}
function sendError(res, statusCode, message, reqId) {
    return res.status(statusCode).json({ success: false, message, requestId: reqId });
}
// Map free-text skin_tone or fitzpatrick_type string to FitzpatrickType
function parseFitzpatrick(raw) {
    const s = raw.trim().toUpperCase().replace(/^TYPE\s*/, "");
    if (["I", "II", "III", "IV", "V", "VI"].includes(s)) {
        return s;
    }
    const lower = raw.toLowerCase();
    if (lower.includes("very pale") || lower.includes("type 1"))
        return "I";
    if (lower.includes("fair") || lower.includes("type 2"))
        return "II";
    if (lower.includes("light") || lower.includes("type 3"))
        return "III";
    if (lower.includes("olive") || lower.includes("medium") || lower.includes("type 4"))
        return "IV";
    if (lower.includes("dark brown") || lower.includes("type 5"))
        return "V";
    if (lower.includes("deep") || lower.includes("black") || lower.includes("type 6"))
        return "VI";
    return "III"; // safe default
}
router.post("/manual", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const reqId = requestId();
    try {
        const { skin_tone, undertone } = manualSchema.parse(req.body);
        const fitzType = parseFitzpatrick(skin_tone);
        const rec = yield (0, recommendationEngine_1.getRecommendation)({
            fitzpatrick_type: fitzType,
            undertone: undertone.toLowerCase(),
            rgb: DEFAULT_RGB,
            hex: DEFAULT_HEX,
        });
        const hex = safeHex((_a = rec.profile) === null || _a === void 0 ? void 0 : _a.hex_derived);
        const data = {
            skin_tone: `Type ${fitzType}`,
            undertone: undertone.toLowerCase(),
            season: ((_b = rec.profile) === null || _b === void 0 ? void 0 : _b.detected_season) || "Autumn",
            confidence: confPct((_c = rec.confidence) === null || _c === void 0 ? void 0 : _c.score),
            rgb: DEFAULT_RGB,
            hex: hex === DEFAULT_HEX ? "#9A796C" : hex,
            best_colors: Array.isArray(rec.best_colors) ? rec.best_colors : [],
            avoid_colors: Array.isArray(rec.avoid_colors) ? rec.avoid_colors : [],
            outfits: Array.isArray(rec.outfits) ? rec.outfits : [],
            style_rules: Array.isArray(rec.style_rules) ? rec.style_rules : [],
            season_explanation: rec.season_explanation || "",
            materials: Array.isArray(rec.materials) ? rec.materials : [],
            accessories: Array.isArray(rec.accessories) ? rec.accessories : [],
        };
        const analysisId = yield saveAnalysis(data, "manual", (_d = req.user) === null || _d === void 0 ? void 0 : _d.id, reqId);
        return res.json({ success: true, analysisId: analysisId || null, data, requestId: reqId });
    }
    catch (error) {
        const appError = error instanceof AppError_1.AppError ? error : new AppError_1.AppError("Manual analysis failed.", 500);
        return sendError(res, appError.statusCode, appError.message, reqId);
    }
}));
router.post("/upload", auth_1.authMiddleware, upload.single("image"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const reqId = requestId();
    let tempFilePath;
    try {
        const requestStartedAt = Date.now();
        if (!req.file)
            throw new AppError_1.AppError("No image file provided.", 400);
        tempFilePath = path_1.default.resolve(req.file.path);
        const metadata = yield (0, sharp_1.default)(tempFilePath).metadata();
        if (!["jpeg", "png", "webp"].includes(metadata.format)) {
            throw new AppError_1.AppError("The uploaded file is corrupt or not a valid image.", 400);
        }
        const detected = yield detect(tempFilePath, reqId);
        if (!detected.face_detected) {
            throw new AppError_1.AppError("No face detected. Please upload a clear, front-facing photo in good lighting.", 422);
        }
        const recommendation = yield (0, recommendationEngine_1.getRecommendation)({
            fitzpatrick_type: detected.fitzpatrick_type,
            undertone: detected.undertone,
            rgb: detected.rgb,
            hex: detected.hex,
        });
        const data = buildData(detected, recommendation);
        let imageUrl = "";
        try {
            imageUrl = yield (0, cloudinary_1.uploadImage)(tempFilePath);
        }
        catch (error) {
            console.warn(`[analysis/upload][${reqId}] Cloudinary upload skipped: ${describeError(error)}`);
        }
        let analysisId = null;
        try {
            analysisId = (yield saveAnalysis(data, imageUrl, (_a = req.user) === null || _a === void 0 ? void 0 : _a.id, reqId)) || null;
        }
        catch (error) {
            console.error(`[analysis/upload][${reqId}] DB save skipped: ${describeError(error)}`);
        }
        console.log(`[analysis/upload][${reqId}] success in ${Date.now() - requestStartedAt}ms | saved=${Boolean(analysisId)} | imageUploaded=${Boolean(imageUrl)}`);
        return res.json({ success: true, analysisId, data, requestId: reqId });
    }
    catch (error) {
        console.error(`[analysis/upload][${reqId}] fatal: ${describeError(error)}`);
        const appError = error instanceof AppError_1.AppError ? error : new AppError_1.AppError("Analysis failed. Please try again.", 500);
        return sendError(res, appError.statusCode, appError.message, reqId);
    }
    finally {
        if (tempFilePath)
            yield fs.unlink(tempFilePath).catch(() => { });
    }
}));
router.get("/history", auth_1.optionalAuthMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const reqId = requestId();
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id))
            return res.json([]);
        const caps = yield analysesCaps(reqId);
        const params = [req.user.id];
        const where = caps.hasUserId ? "WHERE user_id = $1" : "WHERE FALSE";
        const fields = caps.hasResult ? "id, skin_tone, undertone, created_at, result" : "id, skin_tone, undertone, created_at";
        const q = yield db.query(`SELECT ${fields} FROM analyses ${where} ORDER BY created_at DESC LIMIT 10`, params);
        const payload = q.rows.map((row) => {
            const parsed = resultFromUnknown(row.result);
            return {
                analysisId: String(row.id),
                skin_tone: typeof row.skin_tone === "string" ? row.skin_tone : parsed.skin_tone || "Unknown",
                undertone: typeof row.undertone === "string" ? row.undertone : parsed.undertone || "Unknown",
                hex: parsed.hex || DEFAULT_HEX,
                created_at: row.created_at ? new Date(String(row.created_at)).toISOString() : null,
            };
        });
        return res.json(payload);
    }
    catch (error) {
        const appError = error instanceof AppError_1.AppError ? error : new AppError_1.AppError("Failed to fetch analysis history.", 500);
        return sendError(res, appError.statusCode, appError.message, reqId);
    }
}));
router.get("/stats", auth_1.optionalAuthMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const reqId = requestId();
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            return res.json({ most_common_skin_tone: null, most_common_undertone: null, total_analyses: 0 });
        }
        const caps = yield analysesCaps(reqId);
        const params = [];
        const filter = caps.hasUserId ? "WHERE user_id = $1" : "";
        if (filter)
            params.push(req.user.id);
        const q = yield db.query(`SELECT
         (SELECT skin_tone FROM analyses ${filter ? `${filter} AND` : "WHERE"} skin_tone IS NOT NULL AND btrim(skin_tone)<>'' GROUP BY skin_tone ORDER BY COUNT(*) DESC, skin_tone ASC LIMIT 1) AS most_common_skin_tone,
         (SELECT undertone FROM analyses ${filter ? `${filter} AND` : "WHERE"} undertone IS NOT NULL AND btrim(undertone)<>'' GROUP BY undertone ORDER BY COUNT(*) DESC, undertone ASC LIMIT 1) AS most_common_undertone,
         (SELECT COUNT(*)::int FROM analyses ${filter}) AS total_analyses`, params);
        const row = q.rows[0] || {};
        return res.json({
            most_common_skin_tone: typeof row.most_common_skin_tone === "string" ? row.most_common_skin_tone : null,
            most_common_undertone: typeof row.most_common_undertone === "string" ? row.most_common_undertone : null,
            total_analyses: Number(row.total_analyses) || 0,
        });
    }
    catch (error) {
        const appError = error instanceof AppError_1.AppError ? error : new AppError_1.AppError("Failed to fetch analysis stats.", 500);
        return sendError(res, appError.statusCode, appError.message, reqId);
    }
}));
router.get("/result/:id", auth_1.optionalAuthMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const reqId = requestId();
    try {
        const analysisId = String(req.params.id || "").trim();
        if (!isUuid(analysisId))
            throw new AppError_1.AppError("Invalid analysis ID parameter.", 400);
        const caps = yield analysesCaps(reqId);
        const params = [analysisId];
        let where = "id = $1";
        if (caps.hasUserId && ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            params.push(req.user.id);
            where += ` AND user_id = $${params.length}`;
        }
        const fields = caps.hasResult
            ? "id,image_url,skin_tone,undertone,created_at,result"
            : "id,image_url,skin_tone,undertone,created_at";
        const q = yield db.query(`SELECT ${fields} FROM analyses WHERE ${where} LIMIT 1`, params);
        if (!q.rows[0])
            throw new AppError_1.AppError("Analysis not found.", 404);
        const row = q.rows[0];
        const parsed = resultFromUnknown(row.result);
        return res.json({
            success: true,
            analysisId: String(row.id),
            analysis: { id: String(row.id), image_url: row.image_url || null, skin_tone: row.skin_tone || parsed.skin_tone || "Unknown", undertone: row.undertone || parsed.undertone || "Unknown", created_at: row.created_at ? new Date(String(row.created_at)).toISOString() : null },
            result: { season: parsed.season || "Unspecified", confidence: parsed.confidence || 0, rgb: parsed.rgb || DEFAULT_RGB, hex: parsed.hex || DEFAULT_HEX, best_colors: parsed.best_colors || [], avoid_colors: parsed.avoid_colors || [], outfits: parsed.outfits || [], style_rules: parsed.style_rules || [], season_explanation: parsed.season_explanation || "", materials: parsed.materials || [], accessories: parsed.accessories || [] },
            requestId: reqId,
        });
    }
    catch (error) {
        const appError = error instanceof AppError_1.AppError ? error : new AppError_1.AppError("Failed to fetch result.", 500);
        return sendError(res, appError.statusCode, appError.message, reqId);
    }
}));
router.get("/:id", auth_1.optionalAuthMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const reqId = requestId();
    try {
        const analysisId = String(req.params.id || "").trim();
        console.log(`[analysis/fetch][${reqId}] RESULT ID: ${analysisId} | user: ${((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || "unknown"}`);
        if (!isUuid(analysisId))
            throw new AppError_1.AppError("Invalid analysis ID parameter.", 400);
        const caps = yield analysesCaps(reqId);
        const params = [analysisId];
        let where = "id = $1";
        if (caps.hasUserId && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)) {
            params.push(req.user.id);
            where += ` AND user_id = $${params.length}`;
        }
        const fields = caps.hasResult ? "id,result,skin_tone,undertone" : "id,skin_tone,undertone";
        const q = yield db.query(`SELECT ${fields} FROM analyses WHERE ${where} LIMIT 1`, params);
        if (!q.rows[0])
            throw new AppError_1.AppError("Analysis not found.", 404);
        const row = q.rows[0];
        const resultRaw = row.result;
        console.log(`[analysis/fetch][${reqId}] DB ROW — result type: ${typeof resultRaw} | result keys: [${Object.keys(resultRaw || {}).join(", ")}] | skin_tone: ${row.skin_tone} | undertone: ${row.undertone}`);
        const parsed = resultFromUnknown(resultRaw);
        console.log(`[analysis/fetch][${reqId}] PARSED — season: ${parsed.season} | confidence: ${parsed.confidence} | best_colors: ${(_d = (_c = parsed.best_colors) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0} | outfits: ${(_f = (_e = parsed.outfits) === null || _e === void 0 ? void 0 : _e.length) !== null && _f !== void 0 ? _f : 0}`);
        const data = {
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
    }
    catch (error) {
        const appError = error instanceof AppError_1.AppError ? error : new AppError_1.AppError("Failed to fetch analysis.", 500);
        return sendError(res, appError.statusCode, appError.message, reqId);
    }
}));
exports.default = router;
