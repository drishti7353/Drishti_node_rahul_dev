const mongoose = require("mongoose");

const coursesSchema = new mongoose.Schema({
  title: String,
});
const Courses = mongoose.model("courses", coursesSchema);
module.exports = Courses;
