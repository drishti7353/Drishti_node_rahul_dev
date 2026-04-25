const router = require("express").Router();
const notificationController = require("./notificationController");
const auth = require("../../middleware/authentication");
const { ROLES } = require("../../common/utils/constants");
const methodNotAllowed = require("../../middleware/methodNotAllowed");

router
  .route("/")
  .get(
    auth(ROLES.ALL), 
    notificationController.getUserNotifications
  )
  .post(
    auth(ROLES.ALL),
    notificationController.createNotification
  )
  .all(methodNotAllowed);

router
  .route("/subscribe/:eventId")
  .post(
    auth(ROLES.ALL), 
    notificationController.subscribeNotification
  )
  .all(methodNotAllowed);

router
  .route("/:id")
  .get(
    auth(ROLES.ALL),
    notificationController.getUserNotifications
  )
  .all(methodNotAllowed);

router.route('/disable/:eventId')
  .post(auth(ROLES.ALL), notificationController.disableNotification)
  .all(methodNotAllowed);

router.route('/enable/:eventId')
  .post(auth(ROLES.ALL), notificationController.enableNotification)
  .all(methodNotAllowed);

// Allow all roles to access toggle-skip
router.route('/events/:eventId/toggle-skip')
  .post(auth(ROLES.ALL), notificationController.toggleEventSkip)
  .all(methodNotAllowed);

// Add new route for checking notification status
router.route('/status/:eventId')
  .get(auth(ROLES.ALL), notificationController.checkNotificationStatus)
  .all(methodNotAllowed);

module.exports = router;