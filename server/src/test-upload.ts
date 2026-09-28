import { uploadImage } from './utils/cloudinary';
import { readFile } from 'fs/promises';
import path from 'path';

const testUpload = async () => {
  try {
    const imagePath = process.env.TEST_IMAGE_PATH
      ? path.resolve(process.env.TEST_IMAGE_PATH)
      : path.join(__dirname, '../test-image.jpg');
    console.log(`Attempting to upload image from: ${imagePath}`);

    const imageBuffer = await readFile(imagePath);
    const uploaded = await uploadImage(imageBuffer);
    console.log('Upload successful! Cloudinary public ID:', uploaded.publicId);
  } catch (error) {
    console.error('Upload test failed:', error);
  }
};

testUpload();
