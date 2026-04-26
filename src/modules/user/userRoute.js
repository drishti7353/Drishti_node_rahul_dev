const router = require("express").Router();
const multer = require("multer");
const createResponse = require("../../common/utils/createResponse");
const httpStatus = require("../../common/utils/status.json");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const logFormData = (req, res, next) => {
  //console.log('=== Form Data Debug ===');
  //console.log('Body:', req.body);
  //console.log('Files:', req.files);
  next();
};

const profileUpload = upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'teacherIdCard', maxCount: 1 }
]);

const fileUpload = upload.fields([
  { name: 'file', maxCount: 1 }
]);

const teacherUpload = upload.fields([
  { name: 'teacherIdCard', maxCount: 1 }
]);

const {
  userLoginV,
  updateLocationV,
  onBoardUserV,
  teachersListingV,
  updateSocialMediaLinksV,
  addressSchema
} = require("./userValidation");

const {
  userLoginController,
  updateLocationController,
  searchTeachersController,
  onBoardUserController,
  addFiles,
  addTeacherRole,
  getAllUsers,
  getAllTeachers,
  actionOnTeacherAccount,
  verifyOtpController,
  getTeachersRequest,
  updateSocialMediaLinks,
  generateTokenController,
  locationSharing,
  getNearbyVisible,
  getSocialMediaController,
  searchUsers,
  getUser,
  createEventController,
  deleteUserController,
  deleteSelfController
} = require("./userController");

const { createAddressController } = require('../address/addressController');

const { ROLES } = require("../../common/utils/constants");
const auth = require("../../middleware/authentication");
const methodNotAllowed = require("../../middleware/methodNotAllowed");
const validate = require("../../middleware/validate");


router.route("/")
  .get(auth([ROLES.USER, ROLES.ADMIN, ROLES.TEACHER]), getUser)
  .all(methodNotAllowed);

router
  .route("/login")
  .post(validate(userLoginV), userLoginController)
  .all(methodNotAllowed);

router.route("/verify").post(verifyOtpController).all(methodNotAllowed);

router
  .route("/onBoard")
  .post(
    [
      auth(ROLES.ALL),
      // Log incoming request for debugging
      (req, res, next) => {
        console.log('=== ONBOARD REQUEST BODY ===');
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        console.log('Body:', JSON.stringify(req.body, null, 2));
        console.log('Query:', JSON.stringify(req.query, null, 2));
        console.log('===========================');
        next();
      },
      // Handle file uploads first
      (req, res, next) => {
        profileUpload(req, res, (err) => {
          if (err) {
            console.error('File upload error:', err);
            return res.status(422).json({
              success: false,
              message: err.message || 'File upload failed',
              data: null
            });
          }
          next();
        });
      },
      // Then validate
      (req, res, next) => {
        try {
          console.log('Validating request body:', JSON.stringify({
            body: req.body,
            files: req.files ? Object.keys(req.files) : 'No files'
          }, null, 2));
          
          const { error, value } = onBoardUserV.body.validate(req.body, { 
            abortEarly: false,
            allowUnknown: true,
            stripUnknown: true
          });
          
          if (error) {
            console.error('Validation error:', JSON.stringify({
              errors: error.details.map(d => d.message),
              received: req.body
            }, null, 2));
            
            return res.status(422).json({
              success: false,
              message: 'Validation failed',
              errors: error.details.map(d => d.message),
              received: req.body
            });
          }
          
          // Attach validated data to request
          req.validatedBody = value;
          next();
        } catch (err) {
          console.error('Validation middleware error:', err);
          return res.status(500).json({
            success: false,
            message: 'Internal server error during validation',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
          });
        }
      },
      // Log form data after validation
      logFormData,
      // Process the request
      onBoardUserController
    ]
  )
  .all(methodNotAllowed);

router
  .route("/location")
  .put([auth(ROLES.ALL), validate(updateLocationV)], updateLocationController)
  .all(methodNotAllowed);

router
  .route('/search-teacher')
  .get(auth(ROLES.ALL), searchTeachersController)
  .all(methodNotAllowed);

router
  .route("/upload")
  .post(auth(ROLES.ALL), fileUpload, addFiles)
  .all(methodNotAllowed);

router
  .route("/refreshToken")
  .post(generateTokenController)
  .all(methodNotAllowed);

router
  .route("/teacher")
  .post([auth(ROLES.ALL), teacherUpload], addTeacherRole)
  .all(methodNotAllowed);

router.route("/all").get(auth(ROLES.ALL), getAllUsers).all(methodNotAllowed);

router
  .route("/teachers")
  .get(auth(ROLES.ALL), validate(teachersListingV), getAllTeachers)
  .all(methodNotAllowed);

router
  .route("/action-teacher")
  .post(auth(ROLES.ADMIN), actionOnTeacherAccount)
  .all(methodNotAllowed);

router
  .route("/getTeachersRequest")
  .get(auth(ROLES.ADMIN), getTeachersRequest)
  .all(methodNotAllowed);

router
  .route("/getAllTeachers")
  .get(auth(ROLES.ALL), getAllTeachers)
  .all(methodNotAllowed);

router
  .route("/socialMedia")
  .patch(
    auth(ROLES.ALL),
    validate(updateSocialMediaLinksV),
    updateSocialMediaLinks
  )
  .all(methodNotAllowed);

router
  .route("/locationSharing")
  .patch(auth(ROLES.ALL), locationSharing)
  .all(methodNotAllowed);

router.route("/socialLinks/:userId")
  .get(getSocialMediaController)
  .all(methodNotAllowed);

router.route("/nearUser")
  .post(auth(ROLES.ALL), getNearbyVisible)
  .all(methodNotAllowed);

router.post(
  '/create',
  validate(addressSchema),
  createAddressController
);

router
  .route("/createEvent")
  .post(auth(ROLES.ALL), createEventController)
  .all(methodNotAllowed);

router
  .route("/search-user")
  .get(async (req, res, next) => {
    try {
      return searchUsers(req, res);
    } catch (error) {
      next(error);
    }
  })
  .all(methodNotAllowed);

// Add endpoint to update FCM token directly
router.post(
  '/update-fcm',
  auth(ROLES.ALL),
  require('./userController').updateFcmToken
);

// Self delete (authenticated user) - define BEFORE param route to avoid conflicts
router
  .route('/me')
  .delete(auth(ROLES.ALL), deleteSelfController)
  .all(methodNotAllowed);

// Admin-only soft delete user
router
  .route('/:userId')
  .delete(auth(ROLES.ADMIN), deleteUserController)
  .all(methodNotAllowed);

module.exports = router;