const router = require("express").Router();
const validate = require("../../middleware/validate");
const coursesController = require("./coursesController");

const auth = require("../../middleware/authentication");
const { ROLES } = require("../../common/utils/constants");
const methodNotAllowed = require("../../middleware/methodNotAllowed");
router
  .route("/add")
  .post(coursesController.createCourses)
  .all(methodNotAllowed);
router
  .route("/edit/:id")
  .patch(coursesController.editCourse)
  .all(methodNotAllowed);

router.route("/get").get(coursesController.getCoursess).all(methodNotAllowed);
router
  .route("/timeIntervals")
  .get(coursesController.timeIntervals)
  .all(methodNotAllowed);

router
  .route("/delete/:id")
  .delete(coursesController.deleteCourse)
  .all(methodNotAllowed);

module.exports = router;
