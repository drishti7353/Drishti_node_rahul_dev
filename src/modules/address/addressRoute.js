const express = require("express");
const router = express.Router();
const {
  createAddressController,
  updateAddressController,
  deleteAddressController,
  getAllAddressesByUserIdController,
  getNearbyVisibleUser
} = require("../address/addressController");
const validate = require("../../middleware/validate");
const auth = require("../../middleware/authentication");

const {
  addressCreateV,
  addressUpdateV,
} = require("../address/addressValidation");
const methodNotAllowed = require("../../middleware/methodNotAllowed");
const { ROLES } = require("../../common/utils/constants");

router
  .route("/create")
  .post(
    auth(ROLES.ALL),
    // validate(addressCreateV),
    createAddressController
  )
  .all(methodNotAllowed);
router
  .route("/nearUser")
  .post(getNearbyVisibleUser)
  .all(methodNotAllowed)

router
  .route("/delete/:id")
  .delete(deleteAddressController)
  .all(methodNotAllowed); 2

router
  .route("/edit/:id")
  .patch(
    auth(ROLES.WITHOUT_GUEST),
    validate(addressUpdateV),
    updateAddressController
  )
  .all(methodNotAllowed);

router
  .route("/user/:userId")
  .get(getAllAddressesByUserIdController)
  .all(methodNotAllowed)



module.exports = router;
