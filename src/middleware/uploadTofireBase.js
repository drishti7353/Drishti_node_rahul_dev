const { bucket, isStorageInitialized } = require('../config/firebase-config');
const appError = require('../common/utils/appError');
const httpStatus = require('../common/utils/status.json');
const uploadToFirebase = require('../common/utils/uploadToFirebase');

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function uploadFilesToBucket(files) {
  if (!isStorageInitialized) {
    throw new appError(httpStatus.INTERNAL_SERVER_ERROR, 'Firebase storage is not initialized');
  }

  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  const uploadedFiles = [];
  const errors = [];

  for (const file of files) {
    try {
      // Validate file
      if (!file.buffer || !file.mimetype) {
        throw new appError(httpStatus.BAD_REQUEST, 'Invalid file data');
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new appError(httpStatus.BAD_REQUEST, `File size exceeds 10MB limit`);
      }

      if (!ALLOWED_TYPES.includes(file.mimetype)) {
        throw new appError(httpStatus.BAD_REQUEST, `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`);
      }

      // Prepare file path
      const folder = file.fieldname === 'profileImage' ? 'profile-images' : 'teacher-ids';
      const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const destination = `${folder}/${safeFilename}`;

      // Upload with retry mechanism
      let uploadedUrl;
      let lastError;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          uploadedUrl = await uploadToFirebase(file.buffer, destination, file.mimetype);
          break;
        } catch (error) {
          lastError = error;
          console.error(`Upload attempt ${attempt} failed:`, error);
          
          if (attempt < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
          }
        }
      }

      if (!uploadedUrl) {
        throw lastError || new Error('Upload failed after all attempts');
      }

      uploadedFiles.push({
        fieldname: file.fieldname,
        originalname: file.originalname,
        url: uploadedUrl
      });

    } catch (error) {
      errors.push({
        file: file.originalname,
        error: error.message
      });
    }
  }

  if (errors.length > 0) {
    if (errors.length === files.length) {
      throw new appError(httpStatus.INTERNAL_SERVER_ERROR, `All uploads failed: ${JSON.stringify(errors)}`);
    }
    console.warn('Some files failed to upload:', errors);
  }

  return uploadedFiles;
}

module.exports = uploadFilesToBucket;
