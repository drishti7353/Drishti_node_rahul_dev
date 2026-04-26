const router = require("express").Router();
const { uploadToCloudinary } = require("../../common/utils/uploadToCloudinary");
const bannerController = require("./bannersController");

const auth = require("../../middleware/authentication");
const { ROLES } = require("../../common/utils/constants");
const methodNotAllowed = require("../../middleware/methodNotAllowed");
router
  .route("/getBanners")
  .get(auth(ROLES.ALL), bannerController.getBanners)
  .all(methodNotAllowed);
router
  .route("/addBanners")
  .post(
    auth(ROLES.ALL),
    uploadToCloudinary.fields([{ name: "banners", maxCount: 10 }]),
    bannerController.createBanners
  )
  .all(methodNotAllowed);
router
  .route("/deleteBanners/:id")
  .delete(auth(ROLES.ALL), bannerController.deleteBanners)
  .all(methodNotAllowed);
router
  .route("/editBanners/:id")
  .patch(
    auth(ROLES.ALL),
    uploadToCloudinary.fields([{ name: "banners", maxCount: 1 }]),
    bannerController.editBanners
  )
  .all(methodNotAllowed);

module.exports = router;
