const mongoose = require("mongoose");

const bannersShema = new mongoose.Schema({
  image: {
    type: String,
  },
});

const Banners = mongoose.model("banners", bannersShema);

module.exports = Banners;
