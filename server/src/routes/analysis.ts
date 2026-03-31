import { Router, Request, Response, NextFunction } from 'express';
import { execFile } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import { z } from 'zod';
import multer from 'multer';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import { ColorProfile, getRecommendation } from '../engine/recommendationEngine';
import { uploadImage } from '../utils/cloudinary';
import db from '../utils/db';
import { AppError } from '../utils/AppError';

const router = Router();
const execFileAsync = promisify(execFile);
const pythonScriptPath = path.resolve(__dirname, '../../python/detect.py');
const pythonBin = process.env.PYTHON_BIN || 'python';
const PYTHON_TIMEOUT_MS = 20_000;

// Configure Multer for Max 5MB file uploads before processing
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB ceiling
  fileFilter: (req, file, cb) => {
    // Stage 1: Basic HTTP MIME checking (can be spoofed)
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type in header. Only JPEG, PNG, and WebP are allowed.', 400));
    }
  },
});

const manualAnalysisSchema = z.object({
  skin_tone: z.string(),
  undertone: z.string(),
});

const outfitSchema = z.object({
  name: z.string(),
  description: z.string(),
  pieces: z.array(z.string()),
});

const colorProfileSchema = z.object({
  skin_tone: z.string(),
  undertone: z.string(),
  best_colors: z.array(z.string()).default([]),
  avoid_colors: z.array(z.string()).default([]),
  outfits: z.array(outfitSchema).default([]),
});

const detectionSchema = z.object({
  skin_tone: z.string(),
  undertone: z.string(),
  rgb: z.tuple([z.number().int(), z.number().int(), z.number().int()]),
  hex: z.string(),
  brightness: z.number(),
  saturation: z.number(),
  season: z.string(),
  confidence: z.number(),
});

const fallbackRecommendation = colorProfileSchema.parse(getRecommendation('medium', 'neutral'));

function normalizeColorProfile(payload: unknown): ColorProfile {
  let parsedPayload = payload;

  if (typeof parsedPayload === 'string') {
    try {
      parsedPayload = JSON.parse(parsedPayload);
    } catch {
      return fallbackRecommendation;
    }
  }

  const parsed = colorProfileSchema.safeParse(parsedPayload);
  return parsed.success ? parsed.data : fallbackRecommendation;
}

type DetectionResult = z.infer<typeof detectionSchema>;

function logPythonExecution(imagePath: string, stdout: string, stderr: string, elapsedMs: number) {
  console.info('[analysis/upload] Python completed', {
    imagePath,
    elapsedMs,
    stdout: stdout.trim(),
    stderr: stderr.trim(),
  });
}

async function detectColorProfileFromImage(imagePath: string): Promise<DetectionResult> {
  const startedAt = Date.now();

  try {
    const { stdout, stderr } = await execFileAsync(pythonBin, [pythonScriptPath, imagePath], {
      maxBuffer: 1024 * 1024,
      timeout: PYTHON_TIMEOUT_MS,
      windowsHide: true,
    });
    const elapsedMs = Date.now() - startedAt;

    logPythonExecution(imagePath, stdout, stderr || '', elapsedMs);

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(stdout);
    } catch (error) {
      console.error('[analysis/upload] Python JSON parse failed', {
        imagePath,
        elapsedMs,
        stdout: stdout.trim(),
        stderr: (stderr || '').trim(),
      });
      throw new AppError('Analysis returned invalid output.', 500);
    }

    const parsedResult = detectionSchema.safeParse(parsedJson);

    if (!parsedResult.success) {
      throw new AppError('Python detection returned invalid data.', 500);
    }

    return parsedResult.data;
  } catch (error: any) {
    const elapsedMs = Date.now() - startedAt;
    console.error('[analysis/upload] Python execution failed', {
      imagePath,
      elapsedMs,
      stdout: typeof error?.stdout === 'string' ? error.stdout.trim() : '',
      stderr: typeof error?.stderr === 'string' ? error.stderr.trim() : '',
      code: error?.code,
      signal: error?.signal,
      killed: error?.killed,
      message: error?.message,
    });

    if (error instanceof AppError) {
      throw error;
    }

    if (error?.killed || error?.signal === 'SIGTERM') {
      throw new AppError('Analysis timed out. Please try again.', 504);
    }

    throw new AppError('Analysis failed. Please try again.', 500);
  }
}

// POST /analysis/manual
router.post('/manual', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { skin_tone, undertone } = manualAnalysisSchema.parse(req.body);
    const recommendation = getRecommendation(skin_tone, undertone);

    // V1 placeholder user ID
    const userId = 1;
    const client = await db.connect();
    let analysisId: number;

    try {
      await client.query('BEGIN');

      const analysisResult = await client.query(
        'INSERT INTO analyses (user_id, image_url) VALUES ($1, $2) RETURNING id',
        [userId, 'manual']
      );
      analysisId = analysisResult.rows[0].id;

      await client.query('INSERT INTO results (analysis_id, color_profile) VALUES ($1, $2)', [
        analysisId,
        recommendation,
      ]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    res.json({
      analysis_id: analysisId,
      result: recommendation,
    });
  } catch (error) {
    next(error); // Passes to errorHandler.ts
  }
});

// POST /analysis/upload
router.post('/upload', upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  let tempFilePath: string | undefined;

  try {
    if (!req.file) {
      throw new AppError('No image file provided.', 400);
    }

    tempFilePath = path.resolve(req.file.path);

    // Stage 2: Validate Magic Bytes using Sharp (Anti-Spoofing)
    try {
      const metadata = await sharp(tempFilePath).metadata();
      if (!['jpeg', 'png', 'webp'].includes(metadata.format as string)) {
        throw new AppError(`Invalid file signature detected: ${metadata.format}. Expected jpeg, png, or webp.`, 400);
      }
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError('The uploaded file is corrupt or not a valid image.', 400);
    }

    const detectedProfile = await detectColorProfileFromImage(tempFilePath);
    const recommendation = getRecommendation(detectedProfile.skin_tone, detectedProfile.undertone);
    const imageUrl = await uploadImage(tempFilePath);

    // For V1, placeholder user ID.
    const userId = 1;
    const client = await db.connect();
    let analysisId: number;

    try {
      await client.query('BEGIN');

      const analysisResult = await client.query(
        'INSERT INTO analyses (user_id, image_url) VALUES ($1, $2) RETURNING id',
        [userId, imageUrl]
      );
      analysisId = analysisResult.rows[0].id;

      await client.query('INSERT INTO results (analysis_id, color_profile) VALUES ($1, $2)', [
        analysisId,
        recommendation,
      ]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    res.json({
      success: true,
      data: {
        ...detectedProfile,
        best_colors: recommendation.best_colors,
        avoid_colors: recommendation.avoid_colors,
        outfits: recommendation.outfits,
      },
    });
  } catch (error) {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    const message = error instanceof AppError ? error.message : 'Analysis failed. Please try again.';

    res.status(statusCode).json({
      success: false,
      message,
    });
  } finally {
    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(() => {});
    }
  }
});

// GET /analysis/result/:id
router.get('/result/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analysisId = parseInt(String(req.params.id), 10);
    if (isNaN(analysisId)) {
      throw new AppError('Invalid analysis ID parameter.', 400);
    }

    const query = `
     SELECT a.id, a.image_url, a.created_at, r.color_profile
  FROM analyses a
  LEFT JOIN results r ON a.id = r.analysis_id
  WHERE a.id = $1
    `;
    const result = await db.query(query, [analysisId]);

    if (result.rows.length === 0) {
      throw new AppError('ANALYSIS_NOT_FOUND', 404);
    }

    res.json({
      analysis: {
        id: result.rows[0].id,
        image_url: result.rows[0].image_url,
        created_at: result.rows[0].created_at,
      },
      result: normalizeColorProfile(result.rows[0].color_profile),
    });
  } catch (error) {
    next(error); // Passes to errorHandler.ts
  }
});

export default router;
