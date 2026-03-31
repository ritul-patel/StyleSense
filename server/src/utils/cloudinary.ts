import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import sharp from 'sharp';
import { Readable } from 'stream';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryFolder = process.env.CLOUDINARY_FOLDER || 'stylesense';
const uploadTimeoutMs = Number(process.env.CLOUDINARY_UPLOAD_TIMEOUT_MS || 30000);

function assertCloudinaryConfig() {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error('Cloudinary is not configured correctly.');
  }
}

export const uploadImage = async (filePath: string): Promise<string> => {
  assertCloudinaryConfig();

  const optimizedBuffer = await sharp(filePath)
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85 })
    .toBuffer();

  const uploadPromise = new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: cloudinaryFolder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result?.secure_url) {
          reject(new Error('Cloudinary upload completed without a secure URL.'));
          return;
        }

        resolve(result.secure_url);
      }
    );

    Readable.from(optimizedBuffer).pipe(uploadStream);
  });

  const timeoutPromise = new Promise<string>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Cloudinary upload timed out after ${uploadTimeoutMs}ms.`));
    }, uploadTimeoutMs);
  });

  return Promise.race([uploadPromise, timeoutPromise]);
};
