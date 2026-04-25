const { bucket, isStorageInitialized } = require('../../config/firebase-config');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const uploadToFirebase = async (fileBuffer, destination, mimeType) => {
  try {
    if (!isStorageInitialized) {
      throw new Error('Firebase storage is not initialized');
    }

    if (!fileBuffer || !destination) {
      throw new Error('File buffer and destination are required');
    }

    const fileExt = path.extname(destination);
    const uniqueFilename = `${path.dirname(destination)}/${Date.now()}_${uuidv4()}${fileExt}`;
    const file = bucket.file(uniqueFilename);

    const options = {
      metadata: {
        contentType: mimeType,
      },
      resumable: false,
      validation: 'md5'
    };

    await file.save(fileBuffer, options);
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueFilename}`;

    return publicUrl;
  } catch (error) {
    console.error('Upload to Firebase error:', error);
    throw error;
  }
};

module.exports = uploadToFirebase;
