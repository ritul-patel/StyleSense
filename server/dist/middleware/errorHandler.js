"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
const multer_1 = __importDefault(require("multer"));
const AppError_1 = require("../utils/AppError");
function isUploadRoute(req) {
    return req.originalUrl.includes('/analysis/upload') || req.originalUrl.includes('/api/analyze');
}
function uploadErrorResponse(res, statusCode, message) {
    return res.status(statusCode).json({
        success: false,
        message,
    });
}
const errorHandler = (err, req, res, 
// Express uses function arity (length of 4) to determine if it's an error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) => {
    const isDev = process.env.NODE_ENV !== 'production';
    // 1. Zod Validation Error (400) - Flatten arrays for frontend DX
    if (err instanceof zod_1.ZodError) {
        if (isUploadRoute(req)) {
            return uploadErrorResponse(res, 400, 'Analysis failed. Please try again.');
        }
        return res.status(400).json({
            error: 'Validation Error',
            details: err.flatten().fieldErrors,
        });
    }
    if (err instanceof multer_1.default.MulterError) {
        if (isUploadRoute(req)) {
            return uploadErrorResponse(res, 400, err.code === 'LIMIT_FILE_SIZE' ? 'File is too large. Maximum size is 5 MB.' : err.message);
        }
        return res.status(400).json({
            error: err.code === 'LIMIT_FILE_SIZE' ? 'File is too large. Maximum size is 5 MB.' : err.message,
        });
    }
    // 2. Custom App Error (Predictable/Controlled)
    if (err instanceof AppError_1.AppError) {
        // Only pollute server logs with 5xx AppErrors, 4xx are client mistakes
        if (err.statusCode >= 500) {
            console.error(`[AppError ${err.statusCode}]: ${err.message}\n`, err.stack);
        }
        else if (isDev) {
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
    return res.status(500).json(Object.assign({ error: isDev ? (err.message || 'An unexpected error occurred') : 'Internal Server Error' }, (isDev && { stack: err.stack })));
};
exports.errorHandler = errorHandler;
