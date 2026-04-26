const admin = require('firebase-admin');

const initializeFirebase = () => {
  try {
    if (!admin.apps.length) {
      const config = {
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID || "srisridrishti-c1673",
          privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
        })
      };

      // Only add storageBucket if it's specified
      const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || "gs://srisridrishti-c1673.firebasestorage.app";
      if (storageBucket) {
        config.storageBucket = storageBucket;
      }

      admin.initializeApp(config);
    }

    // Only try to get bucket if storageBucket was configured
    const bucket = admin.apps[0].options.storageBucket ? admin.storage().bucket() : null;

    return {
      admin,
      bucket,
      isStorageInitialized: !!bucket,
      messaging: admin.messaging()
    };
  } catch (error) {
    console.error('Firebase initialization error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return {
      admin,
      bucket: null,
      isStorageInitialized: false,
      messaging: admin.messaging()
    };
  }
};

const firebase = initializeFirebase();

module.exports = firebase;
