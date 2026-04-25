const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      index: true,
    },
    mobileNo: {
      type: String,
      required: true,
      index: true,
    },
    countryCode: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
//  required: true,
    },
    expiration_time: {
      type: Date,
//  required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    purpose: {
      type: String,
      enum: ["login", "password_reset", "account_verification"],
//  required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    expires: 600, // Automatically delete documents after 10 minutes
  }
);
const Otp = mongoose.model("Otp", otpSchema);

module.exports = Otp;



