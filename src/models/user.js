const mongoose = require("mongoose");
const constants = require("../common/utils/constants");

// Define the refresh token schema
const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, { _id: false }); // Disable _id for subdocuments

const userSchema = new mongoose.Schema(
  {
    profileImage: String,
    userName: { type: String, unique: true, sparse: true },
    name: String,
    email: String,
    mobileNo: String,
    bio: {
      type: String
    },
    teacherId: String,
    teacherIdCard: String,
    fcmToken: String, // Add this line
    deviceTokens: {
      type: [String],
      default: []
    },
    refreshTokens: {
      type: [refreshTokenSchema],
      default: [],
      validate: {
        validator: function(tokens) {
          // Ensure we don't exceed 5 tokens
          return tokens.length <= 5;
        },
        message: 'Cannot have more than 5 refresh tokens'
      }
    },
    countryCode: String,
    isOnboarded: { type: Boolean, default: false },
    teacherRoleApproved: {
      type: String,
      default: constants.STATUS.PENDING,
      enum: [
        constants.STATUS.PENDING,
        constants.STATUS.ACCEPTED,
        constants.STATUS.REJECTED,
      ],
    },
    location: String,
    geometry: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    },
    role: {
      type: String,
      enum: [
        constants.ROLES.ADMIN,
        constants.ROLES.TEACHER,
        constants.ROLES.USER,
      ],
      default: constants.ROLES.USER,
    },
    deletedAt: mongoose.Schema.Types.Date,
    youtubeUrl: String,
    xUrl: String,
    instagramUrl: String,
    nearByVisible: { type: Boolean, default: false },
    locationSharing: { type: Boolean, default: false },
    teacherRequestHandledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    showContact: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
  }
);

// Create 2dsphere index for geospatial queries
userSchema.index({ geometry: '2dsphere' });

const User = mongoose.model("User", userSchema);

module.exports = User;