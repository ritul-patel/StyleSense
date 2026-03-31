import { uploadImage } from './utils/cloudinary';
import path from 'path';

const testUpload = async () => {
  try {
    const imagePath = path.join(__dirname, '../test-image.txt');
    console.log(`Attempting to upload file from: ${imagePath}`);
    const imageUrl = await uploadImage(imagePath);
    console.log('Upload successful! Image URL:', imageUrl);
  } catch (error) {
    console.error('Upload test failed:', error);
  }
};

testUpload();
