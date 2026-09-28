import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryFolder = process.env.CLOUDINARY_FOLDER || 'stylesense_uploads';
const uploadTimeoutMs = Number(process.env.CLOUDINARY_UPLOAD_TIMEOUT_MS || 30000);
const imageUrlTtlSeconds = 600;

function assertCloudinaryConfig() {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error('Cloudinary is not configured correctly.');
  }
}

async function toInputBuffer(input: Buffer | Readable): Promise<Buffer> {
  if (Buffer.isBuffer(input)) {
    return input;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of input) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

function assertPublicId(publicId: string) {
  if (!publicId || !publicId.trim()) {
    throw new Error('Cloudinary public ID is required.');
  }
}

export type CloudinaryImage = {
  publicId: string;
  resourceType: 'image';
};

export const uploadImage = async (input: Buffer | Readable): Promise<CloudinaryImage> => {
  assertCloudinaryConfig();

  const inputBuffer = await toInputBuffer(input);
  const optimizedBuffer = await sharp(inputBuffer as unknown as Buffer<ArrayBuffer>)
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85 })
    .toBuffer();

  const publicId = `${cloudinaryFolder}/${randomUUID()}`;

  const uploadPromise = new Promise<CloudinaryImage>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: 'image',
        type: 'authenticated',
        overwrite: false,
        invalidate: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result?.public_id) {
          reject(new Error('Cloudinary upload completed without a public ID.'));
          return;
        }

        resolve({
          publicId: result.public_id,
          resourceType: 'image',
        });
      },
    );

    Readable.from(optimizedBuffer).pipe(uploadStream);
  });

  let timeoutHandle: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<CloudinaryImage>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`Cloudinary upload timed out after ${uploadTimeoutMs}ms.`));
    }, uploadTimeoutMs);
  });

  try {
    return await Promise.race([uploadPromise, timeoutPromise]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
};

export const getImageUrl = (publicId: string): string => {
  assertCloudinaryConfig();
  assertPublicId(publicId);

  return cloudinary.url(publicId, {
    resource_type: 'image',
    type: 'authenticated',
    secure: true,
    sign_url: true,
    auth_token: {
      duration: imageUrlTtlSeconds,
    },
  });
};

export const deleteImage = async (publicId: string): Promise<void> => {
  assertCloudinaryConfig();
  assertPublicId(publicId);

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: 'image',
    type: 'authenticated',
    invalidate: true,
  });

  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new Error(`Cloudinary deletion failed: ${result.result}`);
  }
};

export const CLOUDINARY_IMAGE_URL_TTL_SECONDS = imageUrlTtlSeconds;
