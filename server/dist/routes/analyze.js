"use strict";
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
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const multer_1 = __importDefault(require("multer"));
const zod_1 = require("zod");
const AppError_1 = require("../utils/AppError");
const router = (0, express_1.Router)();
const FASTAPI_ANALYZE_URL = process.env.FASTAPI_ANALYZE_URL || 'http://127.0.0.1:8000/analyze';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const FASTAPI_TIMEOUT_MS = 30000;
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
            return;
        }
        cb(new AppError_1.AppError('Only image uploads are supported.', 400));
    },
});
const fastApiResultSchema = zod_1.z.object({
    skin_tone: zod_1.z.string(),
    undertone: zod_1.z.string(),
    rgb: zod_1.z.tuple([zod_1.z.number(), zod_1.z.number(), zod_1.z.number()]).optional(),
    hex: zod_1.z.string().optional(),
    brightness: zod_1.z.number().optional(),
    saturation: zod_1.z.number().optional(),
    season: zod_1.z.string().optional(),
    confidence: zod_1.z.number().optional(),
});
function buildProxyError(error) {
    var _a, _b;
    if (error instanceof AppError_1.AppError) {
        return error;
    }
    if (axios_1.default.isAxiosError(error)) {
        const responseData = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data;
        const detail = typeof (responseData === null || responseData === void 0 ? void 0 : responseData.detail) === 'string'
            ? responseData.detail
            : typeof (responseData === null || responseData === void 0 ? void 0 : responseData.error) === 'string'
                ? responseData.error
                : typeof (responseData === null || responseData === void 0 ? void 0 : responseData.message) === 'string'
                    ? responseData.message
                    : undefined;
        if (error.code === 'ECONNABORTED') {
            return new AppError_1.AppError('FastAPI analysis timed out.', 504);
        }
        if (error.code === 'ECONNREFUSED') {
            return new AppError_1.AppError('FastAPI service is unavailable. Start the Python service and try again.', 502);
        }
        return new AppError_1.AppError(detail || 'FastAPI request failed.', ((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) || 502);
    }
    return new AppError_1.AppError('Analysis failed. Please try again.', 500);
}
router.post('/', upload.single('image'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            throw new AppError_1.AppError('Please upload an image.', 400);
        }
        const formData = new form_data_1.default();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname || 'upload.jpg',
            contentType: req.file.mimetype,
            knownLength: req.file.size,
        });
        const { data } = yield axios_1.default.post(FASTAPI_ANALYZE_URL, formData, {
            headers: formData.getHeaders(),
            timeout: FASTAPI_TIMEOUT_MS,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
        });
        if (data && typeof data === 'object' && typeof data.error === 'string') {
            throw new AppError_1.AppError(data.error, 400);
        }
        const parsed = fastApiResultSchema.safeParse(data);
        if (!parsed.success) {
            throw new AppError_1.AppError('FastAPI returned an invalid analysis response.', 502);
        }
        res.json({
            success: true,
            data: Object.assign(Object.assign({}, parsed.data), { best_colors: [], avoid_colors: [], outfits: [] }),
        });
    }
    catch (error) {
        next(buildProxyError(error));
    }
}));
exports.default = router;
