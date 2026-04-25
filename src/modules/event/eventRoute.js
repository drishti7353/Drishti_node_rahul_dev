const router = require("express").Router();
const eventController = require("./eventController");
const validate = require("../../middleware/validate");
const { createEventV, getEventsV, subscribeToEventV, editEventV, manageTitlesV } = require("./eventValidation");
const auth = require("../../middleware/authentication");
const { ROLES } = require("../../common/utils/constants");
const methodNotAllowed = require("../../middleware/methodNotAllowed");
const requestLogger = require("../../middleware/requestLogger");

router
  .route("/create")
  .post(
    auth([ROLES.TEACHER, ROLES.ADMIN]),    // ← wrap in an array
    validate(createEventV),
    eventController.createEvent
  )
  .all(methodNotAllowed);

router
  .route("/all-events")
  .post(auth(ROLES.ALL), eventController.getAllEvents)
  .all(methodNotAllowed);

router
  .route("/horizontal")
  .post(eventController.getHorizontalEvents)
  .all(methodNotAllowed);

router
  .route("/myevents")
  .get(  auth([ROLES.TEACHER, ROLES.ADMIN]),   eventController.getMyEvents)
  .all(methodNotAllowed);

router
  .route("/byId/:eventId")
  .get(auth(ROLES.ALL), eventController.getEvent)
  .all(methodNotAllowed);

router
  .route("/notifyme/:id")
  .patch(auth(ROLES.ALL), eventController.notificatifyMe)
  .all(methodNotAllowed);

router
  .route("/getParticepent/:id")
  .get(auth(ROLES.ALL), eventController.getParticepent)
  .all(methodNotAllowed);
router
  .route("/deleteEvent/:id")
  .delete(auth(ROLES.TEACHER), eventController.deleteEvent)
  .all(methodNotAllowed);
router
  .route("/editEvent/:id")
  .patch(
    // requestLogger,
    auth([ROLES.TEACHER, ROLES.ADMIN]),  
    eventController.editEvent
  )
  .all(methodNotAllowed);
router
  .route("/getAttendedEvents")
  .get(auth(ROLES.ALL), eventController.getAttendedEvents)
  .all(methodNotAllowed);

router
  .route('/subscribe/:eventId')
  .post(auth(ROLES.USER), validate(subscribeToEventV), eventController.subscribeToEvent)
  .all(methodNotAllowed);

router
  .route('/:eventId/subscribers')
  .get(auth(ROLES.ALL), eventController.getSubscribers)
  .all(methodNotAllowed);

router
  .route('/nearEvent')
  .post(auth(ROLES.ALL), eventController.getNearEventController)
  .all(methodNotAllowed);

  router
  .route('/titles')
  .get(auth(ROLES.ALL), eventController.manageTitles)
  .post( auth([ROLES.TEACHER, ROLES.ADMIN]), eventController.createTitle)
  .post( auth([ROLES.TEACHER, ROLES.ADMIN]), validate(manageTitlesV), eventController.manageTitles)
  .delete( auth([ROLES.TEACHER, ROLES.ADMIN]), eventController.deleteTitle)
  .all(methodNotAllowed);

router
  .route("/teachersEvent")
  .post(auth(ROLES.ALL), eventController.getTeacherEvents)
  .all(methodNotAllowed);

router
  .route("/userProfile")
  .post(auth(ROLES.ALL), eventController.getUserProfile)
  .all(methodNotAllowed);

router.post('/:eventId/skip',  auth([ROLES.TEACHER, ROLES.ADMIN]), eventController.skipClasses);
router.post('/:eventId/resume',  auth([ROLES.TEACHER, ROLES.ADMIN]), eventController.resumeClasses);

// Toggle contact visibility
router
  .route('/toggle-contact-visibility')
  .post( auth([ROLES.TEACHER, ROLES.ADMIN]), eventController.toggleContactVisibility)
  .all(methodNotAllowed);

router
  .route('/:eventId/recurring-meetings')
  .get(auth(ROLES.ALL), eventController.getRecurringMeetings)
  .all(methodNotAllowed);

module.exports = router;
