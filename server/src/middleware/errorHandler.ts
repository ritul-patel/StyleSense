import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';
import { AppError } from '../utils/AppError';

function isUploadRoute(req: Request) {
  return req.originalUrl.includes('/analysis/upload');
}

function uploadErrorResponse(res: Response, statusCode: number, message: string) {
  return res.status(statusCode).json({
    success: false,
    message,
  });
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // Express uses function arity (length of 4) to determine if it's an error handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction 
) => {
  const isDev = process.env.NODE_ENV !== 'production';

  // 1. Zod Validation Error (400) - Flatten arrays for frontend DX
  if (err instanceof ZodError) {
    if (isUploadRoute(req)) {
      return uploadErrorResponse(res, 400, 'Analysis failed. Please try again.');
    }

    return res.status(400).json({
      error: 'Validation Error',
      details: err.flatten().fieldErrors,
    });
  }

  if (err instanceof multer.MulterError) {
    if (isUploadRoute(req)) {
      return uploadErrorResponse(
        res,
        400,
        err.code === 'LIMIT_FILE_SIZE' ? 'File is too large. Maximum size is 5 MB.' : err.message
      );
    }

    return res.status(400).json({
      error: err.code === 'LIMIT_FILE_SIZE' ? 'File is too large. Maximum size is 5 MB.' : err.message,
    });
  }

  // 2. Custom App Error (Predictable/Controlled)
  if (err instanceof AppError) {
    // Only pollute server logs with 5xx AppErrors, 4xx are client mistakes
    if (err.statusCode >= 500) {
      console.error(`[AppError ${err.statusCode}]: ${err.message}\n`, err.stack);
    } else if (isDev) {
      console.warn(`[AppError ${err.statusCode}]: ${err.message}`);
    }

    if (isUploadRoute(req)) {
      return uploadErrorResponse(res, err.statusCode, err.message);
    }

    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // 3. Fallback / Unhandled Exceptions (Always 500)
  // CRITICAL: NEVER leak real error messages (like PostgreSQL syntax failures) to users in Prod!
  console.error('[Unhandled Exception]:', err);

  if (isUploadRoute(req)) {
    return uploadErrorResponse(res, 500, 'Analysis failed. Please try again.');
  }

  return res.status(500).json({
    error: isDev ? (err.message || 'An unexpected error occurred') : 'Internal Server Error',
    ...(isDev && { stack: err.stack }),
  });
};
