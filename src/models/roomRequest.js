const mongoose = require("mongoose");
const constants = require("../common/utils/constants");

const roomRequestSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    status: {
      type: String,
      default: constants.STATUS.PENDING,
      enum: [
        constants.STATUS.PENDING,
        constants.STATUS.ACCEPTED,
        constants.STATUS.REJECTED,
      ],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deletedAt: {
      type: mongoose.Schema.Types.Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const RoomRequest = mongoose.model("RoomRequest", roomRequestSchema);

module.exports = RoomRequest;
