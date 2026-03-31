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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const zod_1 = require("zod");
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const fs = __importStar(require("fs/promises"));
const recommendationEngine_1 = require("../engine/recommendationEngine");
const cloudinary_1 = require("../utils/cloudinary");
const db_1 = __importDefault(require("../utils/db"));
const AppError_1 = require("../utils/AppError");
const router = (0, express_1.Router)();
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
const pythonScriptPath = path_1.default.resolve(__dirname, '../../python/detect.py');
const pythonBin = process.env.PYTHON_BIN || 'python';
const PYTHON_TIMEOUT_MS = 20000;
// Configure Multer for Max 5MB file uploads before processing
const upload = (0, multer_1.default)({
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB ceiling
    fileFilter: (req, file, cb) => {
        // Stage 1: Basic HTTP MIME checking (can be spoofed)
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
            cb(null, true);
        }
        else {
            cb(new AppError_1.AppError('Invalid file type in header. Only JPEG, PNG, and WebP are allowed.', 400));
        }
    },
});
const manualAnalysisSchema = zod_1.z.object({
    skin_tone: zod_1.z.string(),
    undertone: zod_1.z.string(),
});
const outfitSchema = zod_1.z.object({
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    pieces: zod_1.z.array(zod_1.z.string()),
});
const colorProfileSchema = zod_1.z.object({
    skin_tone: zod_1.z.string(),
    undertone: zod_1.z.string(),
    best_colors: zod_1.z.array(zod_1.z.string()).default([]),
    avoid_colors: zod_1.z.array(zod_1.z.string()).default([]),
    outfits: zod_1.z.array(outfitSchema).default([]),
});
const detectionSchema = zod_1.z.object({
    skin_tone: zod_1.z.string(),
    undertone: zod_1.z.string(),
    rgb: zod_1.z.tuple([zod_1.z.number().int(), zod_1.z.number().int(), zod_1.z.number().int()]),
    hex: zod_1.z.string(),
    brightness: zod_1.z.number(),
    saturation: zod_1.z.number(),
    season: zod_1.z.string(),
    confidence: zod_1.z.number(),
});
const fallbackRecommendation = colorProfileSchema.parse((0, recommendationEngine_1.getRecommendation)('medium', 'neutral'));
function normalizeColorProfile(payload) {
    let parsedPayload = payload;
    if (typeof parsedPayload === 'string') {
        try {
            parsedPayload = JSON.parse(parsedPayload);
        }
        catch (_a) {
            return fallbackRecommendation;
        }
    }
    const parsed = colorProfileSchema.safeParse(parsedPayload);
    return parsed.success ? parsed.data : fallbackRecommendation;
}
function logPythonExecution(imagePath, stdout, stderr, elapsedMs) {
    console.info('[analysis/upload] Python completed', {
        imagePath,
        elapsedMs,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
    });
}
function detectColorProfileFromImage(imagePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const startedAt = Date.now();
        try {
            const { stdout, stderr } = yield execFileAsync(pythonBin, [pythonScriptPath, imagePath], {
                maxBuffer: 1024 * 1024,
                timeout: PYTHON_TIMEOUT_MS,
                windowsHide: true,
            });
            const elapsedMs = Date.now() - startedAt;
            logPythonExecution(imagePath, stdout, stderr || '', elapsedMs);
            let parsedJson;
            try {
                parsedJson = JSON.parse(stdout);
            }
            catch (error) {
                console.error('[analysis/upload] Python JSON parse failed', {
                    imagePath,
                    elapsedMs,
                    stdout: stdout.trim(),
                    stderr: (stderr || '').trim(),
                });
                throw new AppError_1.AppError('Analysis returned invalid output.', 500);
            }
            const parsedResult = detectionSchema.safeParse(parsedJson);
            if (!parsedResult.success) {
                throw new AppError_1.AppError('Python detection returned invalid data.', 500);
            }
            return parsedResult.data;
        }
        catch (error) {
            const elapsedMs = Date.now() - startedAt;
            console.error('[analysis/upload] Python execution failed', {
                imagePath,
                elapsedMs,
                stdout: typeof (error === null || error === void 0 ? void 0 : error.stdout) === 'string' ? error.stdout.trim() : '',
                stderr: typeof (error === null || error === void 0 ? void 0 : error.stderr) === 'string' ? error.stderr.trim() : '',
                code: error === null || error === void 0 ? void 0 : error.code,
                signal: error === null || error === void 0 ? void 0 : error.signal,
                killed: error === null || error === void 0 ? void 0 : error.killed,
                message: error === null || error === void 0 ? void 0 : error.message,
            });
            if (error instanceof AppError_1.AppError) {
                throw error;
            }
            if ((error === null || error === void 0 ? void 0 : error.killed) || (error === null || error === void 0 ? void 0 : error.signal) === 'SIGTERM') {
                throw new AppError_1.AppError('Analysis timed out. Please try again.', 504);
            }
            throw new AppError_1.AppError('Analysis failed. Please try again.', 500);
        }
    });
}
// POST /analysis/manual
router.post('/manual', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { skin_tone, undertone } = manualAnalysisSchema.parse(req.body);
        const recommendation = (0, recommendationEngine_1.getRecommendation)(skin_tone, undertone);
        // V1 placeholder user ID
        const userId = 1;
        const client = yield db_1.default.connect();
        let analysisId;
        try {
            yield client.query('BEGIN');
            const analysisResult = yield client.query('INSERT INTO analyses (user_id, image_url) VALUES ($1, $2) RETURNING id', [userId, 'manual']);
            analysisId = analysisResult.rows[0].id;
            yield client.query('INSERT INTO results (analysis_id, color_profile) VALUES ($1, $2)', [
                analysisId,
                recommendation,
            ]);
            yield client.query('COMMIT');
        }
        catch (error) {
            yield client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
        res.json({
            analysis_id: analysisId,
            result: recommendation,
        });
    }
    catch (error) {
        next(error); // Passes to errorHandler.ts
    }
}));
// POST /analysis/upload
router.post('/upload', upload.single('image'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let tempFilePath;
    try {
        if (!req.file) {
            throw new AppError_1.AppError('No image file provided.', 400);
        }
        tempFilePath = path_1.default.resolve(req.file.path);
        // Stage 2: Validate Magic Bytes using Sharp (Anti-Spoofing)
        try {
            const metadata = yield (0, sharp_1.default)(tempFilePath).metadata();
            if (!['jpeg', 'png', 'webp'].includes(metadata.format)) {
                throw new AppError_1.AppError(`Invalid file signature detected: ${metadata.format}. Expected jpeg, png, or webp.`, 400);
            }
        }
        catch (err) {
            if (err instanceof AppError_1.AppError)
                throw err;
            throw new AppError_1.AppError('The uploaded file is corrupt or not a valid image.', 400);
        }
        const detectedProfile = yield detectColorProfileFromImage(tempFilePath);
        const recommendation = (0, recommendationEngine_1.getRecommendation)(detectedProfile.skin_tone, detectedProfile.undertone);
        const imageUrl = yield (0, cloudinary_1.uploadImage)(tempFilePath);
        // For V1, placeholder user ID.
        const userId = 1;
        const client = yield db_1.default.connect();
        let analysisId;
        try {
            yield client.query('BEGIN');
            const analysisResult = yield client.query('INSERT INTO analyses (user_id, image_url) VALUES ($1, $2) RETURNING id', [userId, imageUrl]);
            analysisId = analysisResult.rows[0].id;
            yield client.query('INSERT INTO results (analysis_id, color_profile) VALUES ($1, $2)', [
                analysisId,
                recommendation,
            ]);
            yield client.query('COMMIT');
        }
        catch (error) {
            yield client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
        res.json({
            success: true,
            data: Object.assign(Object.assign({}, detectedProfile), { best_colors: recommendation.best_colors, avoid_colors: recommendation.avoid_colors, outfits: recommendation.outfits }),
        });
    }
    catch (error) {
        const statusCode = error instanceof AppError_1.AppError ? error.statusCode : 500;
        const message = error instanceof AppError_1.AppError ? error.message : 'Analysis failed. Please try again.';
        res.status(statusCode).json({
            success: false,
            message,
        });
    }
    finally {
        if (tempFilePath) {
            yield fs.unlink(tempFilePath).catch(() => { });
        }
    }
}));
// GET /analysis/result/:id
router.get('/result/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const analysisId = parseInt(String(req.params.id), 10);
        if (isNaN(analysisId)) {
            throw new AppError_1.AppError('Invalid analysis ID parameter.', 400);
        }
        const query = `
     SELECT a.id, a.image_url, a.created_at, r.color_profile
  FROM analyses a
  LEFT JOIN results r ON a.id = r.analysis_id
  WHERE a.id = $1
    `;
        const result = yield db_1.default.query(query, [analysisId]);
        if (result.rows.length === 0) {
            throw new AppError_1.AppError('ANALYSIS_NOT_FOUND', 404);
        }
        res.json({
            analysis: {
                id: result.rows[0].id,
                image_url: result.rows[0].image_url,
                created_at: result.rows[0].created_at,
            },
            result: normalizeColorProfile(result.rows[0].color_profile),
        });
    }
    catch (error) {
        next(error); // Passes to errorHandler.ts
    }
}));
exports.default = router;
