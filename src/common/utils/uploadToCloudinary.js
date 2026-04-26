const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const config = require("../config/config");
const path = require("path");

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname).substring(1);
    const filename = path.basename(file.originalname, "." + ext);
    const timestamp = Date.now().toString();
    return {
      folder: "drishti_uploads",
      public_id: `${filename}-${timestamp}`,
      // Cloudinary will automatically infer the format from the file extension
      // unless specified. We can let it auto-detect or force format if needed.
    };
  },
});

const uploadToCloudinary = multer({ storage: storage });

const deleteFromCloudinary = async (fileUrl) => {
  try {
    if (!fileUrl) return;
    
    // Example URL: https://res.cloudinary.com/<cloud_name>/image/upload/v1234567890/drishti_uploads/filename-123456.jpg
    // We need to extract: drishti_uploads/filename-123456
    const urlParts = fileUrl.split("/");
    const filenameWithExt = urlParts[urlParts.length - 1];
    const folder = urlParts[urlParts.length - 2];
    
    const filename = filenameWithExt.split(".")[0];
    const publicId = `${folder}/${filename}`;

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
  }
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };
