const coursesService = require("./coursesService");
const appError = require("../../common/utils/appError");
const httpStatus = require("../../common/utils/status.json");
const createResponse = require("../../common/utils/createResponse");
const constants = require("../../common/utils/constants");

const createCourses = async (request, response) => {
  try {
    const data = await coursesService.createCourse(request);
    if (!data) {
      throw new appError(
        httpStatus.CONFLICT,
        request.t("Courses.UnableToCreateCourses")
      );
    }
    createResponse(
      response,
      httpStatus.OK,
      request.t("Courses.CreateCourses"),
      data
    );
  } catch (error) {
    createResponse(response, error.status, error.message);
  }
};

const getCoursess = async (request, response) => {
  try {
    const data = await coursesService.getCourses(request);
    if (!data) {
      throw new appError(
        httpStatus.CONFLICT,
        request.t("Courses.UnableToGetCourses")
      );
    }
    createResponse(
      response,
      httpStatus.OK,
      request.t("Courses.CoursesFetched"),
      data
    );
  } catch (error) {
    console.error(error);
    createResponse(response, error.status, error.message);
  }
};
const deleteCourse = async (request, response) => {
  try {
    const data = await coursesService.deleteCourse(request);
    if (!data) {
      throw new appError(
        httpStatus.CONFLICT,
        request.t("Courses.UnableToDeleteCourses")
      );
    }
    createResponse(
      response,
      httpStatus.OK,
      request.t("Courses.CourseDeleted"),
      data
    );
  } catch (error) {
    createResponse(response, error.status, error.message);
  }
};
const editCourse = async (request, response) => {
  try {
    const data = await coursesService.editCourse(request);
    if (!data) {
      throw new appError(
        httpStatus.CONFLICT,
        request.t("Courses.UnableToEditCourse")
      );
    }
    createResponse(
      response,
      httpStatus.OK,
      request.t("Courses.EditCourse"),
      data
    );
  } catch (error) {
    createResponse(response, error.status, error.message);
  }
};
const timeIntervals = async (request, response) => {
  try {
    createResponse(
      response,
      httpStatus.OK,
      request.t("Courses.TimeIntervals"),
      constants.TIME_INTERVALS
    );
  } catch (error) {
    createResponse(response, error.status, error.message);
  }
};

module.exports = {
  createCourses,
  getCoursess,
  editCourse,
  deleteCourse,
  timeIntervals,
};
