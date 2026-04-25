const mongoose = require("mongoose");
const moment = require('moment-timezone');
const constants = require("../common/utils/constants");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled", "archived","pause"],
      default: "pending",
    },
    type: {
      type: String,
      enum: ["event", "system", "user", "subscription", "reminder", "reminderNotification"],
      default: "event",
    },
    scheduledTime: {
      type: Date,
      required: true
    },
    userTimezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    processingStarted: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    failureReason: {
      type: String
    },
    lastError: {
      message: String,
      time: Date
    },
    isOneHourReminder: {
      type: Boolean,
      default: false,
    },
    failedAttempts: {
      type: Number,
      default: 0
    },
    processed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    methods: {
      getLocalScheduledTime(timezone) {
        return moment(this.scheduledTime)
          .tz(timezone || this.userTimezone)
          .format('YYYY-MM-DD HH:mm:ss');
      }
    }
  }
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
