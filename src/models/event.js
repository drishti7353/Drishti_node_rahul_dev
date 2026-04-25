const mongoose = require("mongoose");
const { TIME_INTERVALS } = require("../common/utils/constants");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: [String],
    },
    mode: { 
      type: String, 
      enum: ["online", "offline", "both", "online,offline","offline,online"],
      set: function(val) {
        // Handle array or comma-separated string
        if (Array.isArray(val)) {
          return val.length > 1 ? "both" : val[0];
        }
        if (typeof val === 'string' && val.includes(',')) {
          return "both";
        }
        return val;
      }
    },
    aol: { type: [String], enum: ["event", "course", "follow-up"] },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: {
      from: { type: mongoose.Schema.Types.Date },
      to: { type: mongoose.Schema.Types.Date },
    },
    timeOffset: String,
    duration: [
      {
        from: { type: String, enum: TIME_INTERVALS },
        to: { type: String, enum: TIME_INTERVALS },
      },
    ],
    meetingLink: { type: String, trim: true },
    meetingId: { type: String, trim: true },
    recurring: { type: Boolean, default: false },
    recurringPattern: {
      frequency: {
        type: String,
        enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']
      },
      interval: {
        type: Number,
        min: 1,
        default: 1
      },
      count: {
        type: Number,
        min: 1
      },
      until: {
        type: String // Changed from Date to String to better handle ISO string format
      }
    },
    description: String,
    address: [],
    phoneNumber: [{ type: String }], // Changed from String to array of strings
    registrationLink: String,
    location: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] },
    },
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    deletedAt: { type: mongoose.Schema.Types.Date },
    notifyTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Participants (user IDs)
    imagesAndCaptions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        images: [{ caption: String, isPrivate: Boolean, image: String }],
      },
    ],
    subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    skippedDates: {
      type: [String],  // Array of strings in YYYY-MM-DD format
      default: [],      // Initialize as empty array
      validate: {
        validator: function(dates) {
          return dates.every(date => 
            /^\d{4}-\d{2}-\d{2}$/.test(date)
          );
        },
        message: 'Skipped dates must be in YYYY-MM-DD format'
      }
    },
    recurringDates: {
      type: [{
        from: { type: mongoose.Schema.Types.Date, required: true },
        to: { type: mongoose.Schema.Types.Date, required: true }
      }],
      default: [], // Initialize as empty array
      validate: {
        validator: function(dates) {
          return dates.every(dateObj => 
            dateObj.from && dateObj.to && dateObj.from <= dateObj.to
          );
        },
        message: 'Each recurring date must have valid from and to dates with from <= to'
      }
    },
    parentEventId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Event",
      default: null,
      index: true // Add index for better query performance
    },
  },
  { timestamps: true }
);

// Add a utility method to check if a date is skipped
eventSchema.methods.isDateSkipped = function(date) {
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  return this.skippedDates.includes(dateStr);
};

eventSchema.index({ location: "2dsphere" }); // Ensure this is the only 2dsphere index
// Remove any redundant 2dsphere indexes from the collection

// Static method to update title enum values
eventSchema.statics.updateTitleEnum = async function(newTitles) {
  // Defensive check to avoid TypeError
  const titlePath = this.schema && this.schema.path && this.schema.path('title');
  if (titlePath && titlePath.options) {
    titlePath.options.enum = newTitles;
  } else {
    console.error('[updateTitleEnum] Could not update title enum: schema or title path is undefined');
  }
  // Return the updated enum values (or attempted values)
  return newTitles;
};

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
