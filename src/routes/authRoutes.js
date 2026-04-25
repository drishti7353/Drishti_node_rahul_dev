const express = require('express');
const router = express.Router();
const { refreshToken, updateFcmToken } = require('../controllers/auth');
const methodNotAllowed = require('../middleware/methodNotAllowed');

// Route for refreshing tokens
router.route('/refresh')
  .post(refreshToken)
  .all(methodNotAllowed);

// // Route for updating FCM token
// router.route('/update-fcm')
//   .post(updateFcmToken)
//   .all(methodNotAllowed);

module.exports = router;
