const router = require("express").Router();
const profileController = require("./profileController");
const validate = require("../../middleware/validate");
const methodNotAllowed = require("../../middleware/methodNotAllowed");
const { createProfileV } = require("./profileValidation");
const upload = require("./multer");

router
    .route("/")
    .post(
        upload.single('profileImage'),
        validate(createProfileV),
        profileController.createProfile
    )
    .all(methodNotAllowed);

router
    .route("/all-profiles")
    .get(profileController.getProfiles)
    .all(methodNotAllowed);

router
    .route("/:id")
    .get(profileController.getProfileById)
    .all(methodNotAllowed);

router
    .route("/update/:id")
    .patch(
        upload.single('profileImage'),
        profileController.editProfile
    )
    .all(methodNotAllowed);

router
    .route("/delete/:id")
    .delete(profileController.deleteProfile)
    .all(methodNotAllowed);

module.exports = router;