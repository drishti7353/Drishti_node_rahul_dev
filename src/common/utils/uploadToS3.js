const multer = require("multer");
const aws = require("aws-sdk");
const multerS3 = require("multer-s3");
const config = require("../config/config");
const path = require("path");

const s3 = new aws.S3({
  accessKeyId: config.aws.awsAccessKeyId,
  secretAccessKey: config.aws.awsSecretAccessKey,
  region: config.aws.awsRegion,
});
const uploadToS3 = multer({
  storage: multerS3({
    endpoint: `https://s3.${process.env.AWS_REGION}.amazonaws.com`,
    s3ForcePathStyle: true,
    s3: s3,
    bucket: config.aws.s3Bucket,
    cacheControl: "max-age=31536000",
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const filename = path.basename(file.originalname, ext);
      const timestamp = Date.now().toString();
      cb(null, `${filename}-${timestamp}${ext}`);
    },
  }),
});

const deleteFromS3 = async (fileName) => {
  const deleteParams = {
    Bucket: config.aws.s3Bucket,
    Key: fileName.split("/").pop(),
  };
  await s3.deleteObject(deleteParams).promise();
};
// const uploadToS3 = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: config.aws.s3Bucket,
//     acl: "public-read",
//     metadata: function (req, file, cb) {
//       //console.log("file", file);
//       cb(null, { fieldName: file.fieldname });
//     },
//     key: function (req, file, cb) {
//       //console.log("key", file);
//       cb(null, Date.now().toString());
//     },
//   }),
// }).fields([
//   { name: "teacherIdCard", maxCount: 1 },
//   { name: "profileImageUrl", maxCount: 1 },
// ]);

module.exports = { uploadToS3, deleteFromS3 };
