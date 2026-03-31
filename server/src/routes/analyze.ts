import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import FormData from 'form-data';
import multer from 'multer';
import { z } from 'zod';
import { AppError } from '../utils/AppError';

const router = Router();

const FASTAPI_ANALYZE_URL = process.env.FASTAPI_ANALYZE_URL || 'http://127.0.0.1:8000/analyze';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const FASTAPI_TIMEOUT_MS = 30_000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }

    cb(new AppError('Only image uploads are supported.', 400));
  },
});

const fastApiResultSchema = z.object({
  skin_tone: z.string(),
  undertone: z.string(),
  rgb: z.tuple([z.number(), z.number(), z.number()]).optional(),
  hex: z.string().optional(),
  brightness: z.number().optional(),
  saturation: z.number().optional(),
  season: z.string().optional(),
  confidence: z.number().optional(),
});

function buildProxyError(error: unknown) {
  if (error instanceof AppError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | { detail?: unknown; error?: unknown; message?: unknown }
      | undefined;
    const detail =
      typeof responseData?.detail === 'string'
        ? responseData.detail
        : typeof responseData?.error === 'string'
          ? responseData.error
          : typeof responseData?.message === 'string'
            ? responseData.message
            : undefined;

    if (error.code === 'ECONNABORTED') {
      return new AppError('FastAPI analysis timed out.', 504);
    }

    if (error.code === 'ECONNREFUSED') {
      return new AppError('FastAPI service is unavailable. Start the Python service and try again.', 502);
    }

    return new AppError(detail || 'FastAPI request failed.', error.response?.status || 502);
  }

  return new AppError('Analysis failed. Please try again.', 500);
}

router.post('/', upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('Please upload an image.', 400);
    }

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname || 'upload.jpg',
      contentType: req.file.mimetype,
      knownLength: req.file.size,
    });

    const { data } = await axios.post(FASTAPI_ANALYZE_URL, formData, {
      headers: formData.getHeaders(),
      timeout: FASTAPI_TIMEOUT_MS,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    if (data && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string') {
      throw new AppError((data as { error: string }).error, 400);
    }

    const parsed = fastApiResultSchema.safeParse(data);
    if (!parsed.success) {
      throw new AppError('FastAPI returned an invalid analysis response.', 502);
    }

    res.json({
      success: true,
      data: {
        ...parsed.data,
        best_colors: [],
        avoid_colors: [],
        outfits: [],
      },
    });
  } catch (error) {
    next(buildProxyError(error));
  }
});

export default router;
