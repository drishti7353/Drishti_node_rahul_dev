const mongoose = require("mongoose");
const appError = require("../../common/utils/appError");
const httpStatus = require("../../common/utils/status.json");
const constants = require("../../common/utils/constants");
const Courses = require("../../models/courses");

async function createCourse(request) {
  return await Courses.create(request.body);
}

async function getCourses(request) {
  return request.query.id
    ? await Courses.findById(request.query.id)
    : await Courses.find();
}

const deleteCourse = async (request) => {
  return await Courses.findByIdAndDelete(request.params.id);
};
const editCourse = async (request) => {
  return await Courses.findByIdAndUpdate(
    request.params.id,
    { ...request.body },
    { new: true }
  );
};

module.exports = {
  createCourse,
  editCourse,
  deleteCourse,
  getCourses,
};
