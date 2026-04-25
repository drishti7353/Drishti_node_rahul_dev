const router = require("express").Router();
const roomController = require("./roomController");
const auth = require("../../middleware/authentication");
const { ROLES } = require("../../common/utils/constants");
const validate = require("../../middleware/validate");
const {
  createRoomV,
  addMemberToRoomV,
  actionOnRoomRequestV,
} = require("./roomValidation");
const methodNotAllowed = require("../../middleware/methodNotAllowed");
router
  .route("/")
  .post([auth(ROLES.ALL), validate(createRoomV)], roomController.createRoom)
  .get(auth(ROLES.ALL), roomController.getMyRooms)
  .all(methodNotAllowed);

router
  .route("/add-member")
  .post(
    [auth(ROLES.ALL), validate(addMemberToRoomV)],
    roomController.addMemberToRoom
  )
  .all(methodNotAllowed);
router
  .route("/requests")
  .get(auth(ROLES.ALL), roomController.getRoomRequest)
  .all(methodNotAllowed);
router
  .route("/request-action")
  .post(
    [auth(ROLES.ALL), validate(actionOnRoomRequestV)],
    roomController.actionOnRoomRequest
  )
  .all(methodNotAllowed);

module.exports = router;
