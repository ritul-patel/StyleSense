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
exports.uploadImage = void 0;
const cloudinary_1 = require("cloudinary");
const dotenv_1 = __importDefault(require("dotenv"));
const sharp_1 = __importDefault(require("sharp"));
const stream_1 = require("stream");
dotenv_1.default.config();
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const cloudinaryFolder = process.env.CLOUDINARY_FOLDER || 'stylesense';
const uploadTimeoutMs = Number(process.env.CLOUDINARY_UPLOAD_TIMEOUT_MS || 30000);
function assertCloudinaryConfig() {
    if (!process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET) {
        throw new Error('Cloudinary is not configured correctly.');
    }
}
const uploadImage = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    assertCloudinaryConfig();
    const optimizedBuffer = yield (0, sharp_1.default)(filePath)
        .rotate()
        .resize({
        width: 1600,
        height: 1600,
        fit: 'inside',
        withoutEnlargement: true,
    })
        .jpeg({ quality: 85 })
        .toBuffer();
    const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
            folder: cloudinaryFolder,
            resource_type: 'image',
        }, (error, result) => {
            if (error) {
                reject(error);
                return;
            }
            if (!(result === null || result === void 0 ? void 0 : result.secure_url)) {
                reject(new Error('Cloudinary upload completed without a secure URL.'));
                return;
            }
            resolve(result.secure_url);
        });
        stream_1.Readable.from(optimizedBuffer).pipe(uploadStream);
    });
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`Cloudinary upload timed out after ${uploadTimeoutMs}ms.`));
        }, uploadTimeoutMs);
    });
    return Promise.race([uploadPromise, timeoutPromise]);
});
exports.uploadImage = uploadImage;
