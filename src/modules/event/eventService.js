const mongoose = require("mongoose");
const isEqual = require('lodash.isequal');
const Event = require("../../models/event");
const Subscription = require("../../models/subscribe");
const { getDistance } = require("../../common/utils/app_functions");
const appError = require("../../common/utils/appError");
const httpStatus = require("../../common/utils/status.json");
const constants = require("../../common/utils/constants");
const User = require("../../models/user");
const Notification = require("../../models/notification");
const ObjectId = mongoose.Types.ObjectId;
const { distortCoordinates } = require('../../common/utils/helpers');
const { RRule } = require('rrule');

// Redis client disabled to fix caching issues
// const redis = require('redis');
// const redisClient = redis.createClient();
// redisClient.connect().catch(console.error);
let io = null;
function setSocketIO(ioInstance) { io = ioInstance; }
module.exports.setSocketIO = setSocketIO;

// Helper function to generate recurring dates array
function generateRecurringDates(dateObj, recurringPattern) {
  console.log('\x1b[35m%s\x1b[0m', 'generateRecurringDates called with:', { dateObj, recurringPattern });
  
  if (!recurringPattern || !dateObj?.from || !dateObj?.to) {
    console.log('\x1b[35m%s\x1b[0m', 'Missing required fields for recurring dates generation');
    return [];
  }

  const { frequency, interval = 1, until } = recurringPattern;
  const startDate = new Date(dateObj.from);
  const endDate = new Date(dateObj.to);
  const duration = endDate.getTime() - startDate.getTime();

  console.log('\x1b[35m%s\x1b[0m', 'Generating recurring dates:', {
    frequency,
    interval,
    until,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    duration
  });

  const freqMapping = {
    DAILY: RRule.DAILY,
    WEEKLY: RRule.WEEKLY,
    MONTHLY: RRule.MONTHLY,
    YEARLY: RRule.YEARLY,
  };

  const ruleOptions = {
    freq: freqMapping[frequency] || RRule.WEEKLY,
    interval: interval,
    dtstart: startDate,
  };

  if (until) {
    ruleOptions.until = new Date(until);
  } else {
    // Default: generate for next 6 months if no end specified
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    ruleOptions.until = sixMonthsLater;
  }

  console.log('\x1b[35m%s\x1b[0m', 'RRule options:', ruleOptions);

  const rule = new RRule(ruleOptions);
  const occurrences = rule.all();

  const recurringDatesArray = occurrences.map(occurrence => {
    const occurrenceEnd = new Date(occurrence.getTime() + duration);
    return {
      from: occurrence,
      to: occurrenceEnd
    };
  });

  console.log('\x1b[35m%s\x1b[0m', 'Generated recurring dates array:', recurringDatesArray.length, 'entries');
  recurringDatesArray.forEach((date, idx) => {
    console.log('\x1b[35m%s\x1b[0m', `Date ${idx + 1}: ${date.from.toISOString()} to ${date.to.toISOString()}`);
  });

  return recurringDatesArray;
}

// working

// working
// working
async function createEvent(request) {
  console.log('\x1b[35m%s\x1b[0m', 'Creating new event:', request.body);

  // Normalize mode value
  let { coordinates, mode, ...remainingBody } = request.body;
  console.log('\x1b[35m%s\x1b[0m', 'Extracted coordinates:', coordinates);
  console.log('\x1b[35m%s\x1b[0m', 'Original mode:', mode);
  console.log('\x1b[35m%s\x1b[0m', 'Mode type:', typeof mode);

  // Handle mode conversion
  if (Array.isArray(mode)) {
    mode = mode.length > 1 ? "both" : mode[0];
    console.log('\x1b[35m%s\x1b[0m', 'Converted mode from array:', mode);
  } else if (typeof mode === 'string' && mode.includes(',')) {
    mode = "both";
    console.log('\x1b[35m%s\x1b[0m', 'Converted mode from string with comma:', mode);
  }

  console.log('\x1b[35m%s\x1b[0m', 'Remaining body:', remainingBody);

  // Explicitly handle meetingId and meetingLink
  let meetingId = request.body.meetingId !== undefined ? request.body.meetingId : null;
  let meetingLink = request.body.meetingLink !== undefined ? request.body.meetingLink : null;
  // If offline mode, force both to null
  if (mode === 'offline') {
    meetingId = null;
    meetingLink = null;
  }
  // Validate location for offline/both modes
  if ((mode === 'offline' || mode === 'both')) {
    if (!Array.isArray(coordinates) || coordinates.length !== 2 ||
        typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number') {
      throw new appError(httpStatus.BAD_REQUEST, "Offline or hybrid events require valid coordinates");
    }
  }

  // Set full GeoJSON location object for offline/both, else null
  let location = null;
  if ((mode === 'offline' || mode === 'both')) {
    if (Array.isArray(coordinates) && coordinates.length === 2 &&
        typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
      location = {
        type: 'Point',
        coordinates: coordinates
      };
      console.log('\x1b[35m%s\x1b[0m', 'Set location for offline/both mode:', location);
    }
  } else {
    console.log('\x1b[35m%s\x1b[0m', 'Mode is online, location set to null');
  }

  // Generate recurring dates if this is a recurring event
  let recurringDates = [];
  if (request.body.recurring && request.body.recurringPattern) {
    recurringDates = generateRecurringDates(request.body.date, request.body.recurringPattern);
    console.log('\x1b[35m%s\x1b[0m', 'Generated recurring dates:', recurringDates.length, recurringDates);
  }

  // Create event data object
  const eventData = {
    userId: request.user.id,
    mode,
    ...remainingBody,
    meetingId,
    meetingLink,
    recurringDates
  };
  
  // Only add location if it's not null (for offline/both modes)
  if (location !== null) {
    eventData.location = location;
  }
  
  console.log('\x1b[35m%s\x1b[0m', 'Final event data before create:', JSON.stringify(eventData, null, 2));
  
  const event = await Event.create(eventData);

  console.log('\x1b[35m%s\x1b[0m', 'Event created successfully:', event._id);

  // Redis cache invalidation disabled
  // try {
  //   const keys = await redisClient.keys('events:*');
  //   for (const key of keys) await redisClient.del(key);
  // } catch (e) {
  //   console.error('Redis cache invalidation error', e);
  // }

  // Emit event to socket clients
  if (io) io.emit('eventChanged', { type: 'create', event });

  return event;
}

async function editEvent(request) {
  const startTime = Date.now();
  // After editing event, invalidate cache and emit socket event

  console.log('Editing event:', request.params.id);
  console.log('Request body:', JSON.stringify(request.body, null, 2));
  
  // First check if event exists and user has permission
  const existingEvent = await Event.findById(request.params.id);
  if (!existingEvent) {
    console.error('Event not found with ID:', request.params.id);
    throw new appError(httpStatus.NOT_FOUND, "Event not found");
  }

  if (existingEvent.userId.toString() !== request.user.id) {
    console.error('Unauthorized edit attempt. User ID:', request.user.id, 'Event owner ID:', existingEvent.userId);
    throw new appError(httpStatus.FORBIDDEN, "Not authorized to edit this event");
  }

  // Create a clean update object
  const updateData = {};
  const fields = [
    'title', 'mode', 'aol', 'description', 'address', 'phoneNumber', 'date', 'duration', 'meetingId', 'meetingLink',
    'recurring', 'recurringPattern', 'location', 'teachers', 'participants', 'notifyTo'
  ];
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(request.body, field)) {
      const newValue = request.body[field];
      const oldValue = existingEvent[field];
      // Use deep equality for arrays/objects
      if (!isEqual(newValue, oldValue)) {
        updateData[field] = newValue;
      }
    }
  }

  // Special handling for recurring/recurringPattern
  if (Object.prototype.hasOwnProperty.call(request.body, 'recurring')) {
    if (request.body.recurring && request.body.recurringPattern) {
      if (!isEqual(request.body.recurringPattern, existingEvent.recurringPattern)) {
        updateData.recurringPattern = request.body.recurringPattern;
      }
    } else if (request.body.recurring === false) {
      updateData.recurringPattern = null;
    }
  }
  if (request.body.phoneNumber) updateData.phoneNumber = request.body.phoneNumber;
  if (request.body.profileImage) updateData.profileImage = request.body.profileImage;
  if (request.body.registrationLink !== undefined) updateData.registrationLink = request.body.registrationLink;
  if (request.body.teachers) updateData.teachers = request.body.teachers;
  // Explicitly handle meetingId and meetingLink
  if (request.body.meetingId !== undefined) updateData.meetingId = request.body.meetingId;
  if (request.body.meetingLink !== undefined) updateData.meetingLink = request.body.meetingLink;
  if (request.body.timeOffset) updateData.timeOffset = request.body.timeOffset;

  // If mode is set to offline, force both to null
  const modeVal = request.body.mode || existingEvent.mode;
  if (modeVal === 'offline') {
    updateData.meetingId = null;
    updateData.meetingLink = null;
  }
  
  // Handle nested objects
  if (request.body.date) {
    updateData.date = {};
    if (request.body.date.from) updateData.date.from = request.body.date.from;
    if (request.body.date.to) updateData.date.to = request.body.date.to;
  }
  
  // Handle arrays
  if (request.body.duration && Array.isArray(request.body.duration)) {
    updateData.duration = request.body.duration;
  }
  
  // Validate and set location for offline/both modes
  const updateMode = request.body.mode || existingEvent.mode;
  let updateCoordinates = request.body.coordinates || (request.body.location && request.body.location.coordinates) || (existingEvent.location && existingEvent.location.coordinates);

  if ((updateMode === 'offline' || updateMode === 'both')) {
    if (!Array.isArray(updateCoordinates) || updateCoordinates.length !== 2 ||
        typeof updateCoordinates[0] !== 'number' || typeof updateCoordinates[1] !== 'number') {
      throw new appError(httpStatus.BAD_REQUEST, "Offline or hybrid events require valid coordinates");
    }
    updateData.location = {
      type: 'Point',
      coordinates: updateCoordinates
    };
  } else if (updateMode === 'online') {
    updateData.location = null;
  }

  // Handle recurring setting
  if (request.body.recurring !== undefined) {
    updateData.recurring = request.body.recurring;
    
    // Handle recurring pattern if recurring is true
    if (request.body.recurring === true && request.body.recurringPattern) {
      // Create a properly structured recurringPattern object
      updateData.recurringPattern = {
        frequency: request.body.recurringPattern.frequency,
        interval: request.body.recurringPattern.interval || 1
      };
      
      // Only add count if it exists
      if (request.body.recurringPattern.count) {
        updateData.recurringPattern.count = parseInt(request.body.recurringPattern.count, 10);
      }
      
      // Only add until date if it exists
      if (request.body.recurringPattern.until) {
        updateData.recurringPattern.until = request.body.recurringPattern.until;
      }
      
      // Generate new recurring dates if date is being updated or recurring pattern is being set
      if (request.body.date || !existingEvent.recurringDates || existingEvent.recurringDates.length === 0) {
        const dateForGeneration = request.body.date || existingEvent.date;
        updateData.recurringDates = generateRecurringDates(dateForGeneration, updateData.recurringPattern);
        console.log('Generated new recurring dates for edit:', updateData.recurringDates.length);
      }
      
      console.log('Setting recurring pattern:', JSON.stringify(updateData.recurringPattern, null, 2));
    } 
    // If recurring is false, set recurringPattern to null and clear recurringDates
    else if (request.body.recurring === false) {
      updateData.recurringPattern = null;
      updateData.recurringDates = [];
    }
  }

  console.log('Final update data:', JSON.stringify(updateData, null, 2));
  const updateStart = Date.now();

  // Update the event with new data
  const event = await Event.findByIdAndUpdate(
    request.params.id,
    { $set: updateData },
    { 
      new: true,
      runValidators: true
    }
  );
  const updateEnd = Date.now();

  if (!event) {
    throw new appError(httpStatus.NOT_FOUND, "Failed to update event");
  }

  console.log('Event updated successfully:', event._id);
  console.log(`[Timing] Fetch: ${updateStart - startTime}ms, Update: ${updateEnd - updateStart}ms`);

  // Offload socket emits and notifications to async (non-blocking)
  setImmediate(() => {
    try {
      if (io) io.emit('eventChanged', { type: 'update', event });
      // If you have notification logic, call it here (e.g., sendNotifications)
      // sendNotifications(event.notifyTo, event);
    } catch (e) {
      console.error('Async post-update error:', e);
    }
  });

  return event;
}

// working
async function deleteEvent(request) {
  // After deleting event, invalidate cache and emit socket event

  return await Event.findByIdAndDelete(request.params.id);
}


// working
async function getEvent(request) {
  const userId = request.user ? request.user.id : null;
  
  const eventData = await Event.aggregate([
    { $match: { _id: new ObjectId(request.params.eventId) } },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "teachers",
        foreignField: "_id",
        as: "teachersDetails",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "notifyTo",
        foreignField: "_id",
        as: "participantsDetails",
        pipeline: [{ $project: { name: 1, email: 1, profileImage: 1, userName: 1 } }],
      },
    },
  ]);

  // Add isNotifyMe flag and handle recurring event date updates
  if (eventData && eventData.length > 0) {
    const event = eventData[0];
    const notifyToArray = event.notifyTo || [];
    const isNotifyMe = userId ? notifyToArray.some(id => id.toString() === userId.toString()) : false;
    
    // Add isNotifyMe flag to the event object
    event.isNotifyMe = isNotifyMe;
    
    // For recurring events, update the main date to next upcoming occurrence if current date has passed
    if (event.recurring && event.recurringDates && event.recurringDates.length > 0) {
      const now = new Date();
      const currentEventEndDate = new Date(event.date.to);
      
      console.log(`[getEvent] Checking recurring event: ${event.title}`);
      console.log(`[getEvent] Current event end date: ${currentEventEndDate.toISOString()}`);
      console.log(`[getEvent] Current time: ${now.toISOString()}`);
      
      // If the current event date has passed, update to next upcoming occurrence
      if (currentEventEndDate < now) {
        console.log(`[getEvent] Current event date has passed, finding next occurrence...`);
        
        // Find the next upcoming date from recurringDates
        const upcomingDate = event.recurringDates
          .filter(dateRange => new Date(dateRange.to) >= now)
          .sort((a, b) => new Date(a.from) - new Date(b.from))[0];
          
        if (upcomingDate) {
          console.log(`[getEvent] Found next occurrence: ${new Date(upcomingDate.from).toISOString()} to ${new Date(upcomingDate.to).toISOString()}`);
          
          // Update the main event's date to the next occurrence
          event.date = {
            from: upcomingDate.from,
            to: upcomingDate.to
          };
          
          // Also update in database for persistence
          await Event.findByIdAndUpdate(
            event._id,
            {
              $set: {
                'date.from': upcomingDate.from,
                'date.to': upcomingDate.to
              }
            }
          );
          
          console.log(`[getEvent] Updated event date in database and response`);
        } else {
          console.log(`[getEvent] No future occurrences found for recurring event`);
        }
      } else {
        console.log(`[getEvent] Current event date is still active`);
      }
    }
  }

  return eventData;
}
/**
 * Helper: Compute "start of day" and "start of next day" in IST (UTC+5:30),
 * returning both as ISO strings (UTC timestamps).
 */

function getStartOfDayAndNextDay(inputDate) {
  const dateObj = new Date(inputDate);
  // Force interpretation in UTC to match the Z in the input
  const startOfDay = new Date(Date.UTC(
    dateObj.getUTCFullYear(),
    dateObj.getUTCMonth(),
    dateObj.getUTCDate(),
    0, 0, 0, 0
  ));
  const startOfNextDay = new Date(startOfDay);
  startOfNextDay.setUTCDate(startOfNextDay.getUTCDate() + 1);
  return [startOfDay, startOfNextDay];
}




async function getAllEvents(request) {
  try {
    console.log(">>> [DEBUG] getEvents called");
    let { mode = "both", date, page = 1, pageSize = 100, latitude, longitude, radius = 100, searchQuery } = request.body;

    console.log(">>> [DEBUG] Request parameters:");
    console.log("   mode:", mode);
    console.log("   date:", date);
    console.log("   searchQuery:", searchQuery);
    console.log("   latitude:", latitude);
    console.log("   longitude:", longitude);
    console.log("   radius:", radius);

    // 1. Compute start of today in LOCAL time (00:00:00)
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(), // local midnight
      0, 0, 0, 0
    );
    console.log(">>> [DEBUG] Start of today (local):", startOfToday);

    // 2. Default matchCondition:
    //    - Events starting today or after, OR
    //    - Events that began before today but end today or after
  // 2. Default matchCondition:
//    - Events that have not ended before today (ongoing or upcoming)
let matchCondition = {
  "date.to": { $gte: startOfToday }
};
console.log(">>> [DEBUG] Default matchCondition:", JSON.stringify(matchCondition, null, 2));

    // 3. If a `date` filter is provided, restrict to that day's window
    if (date) {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) {
        console.error(">>> [ERROR] Invalid date provided:", date);
        return {
          success: false,
          status: 400,
          message: `Invalid date value: '${date}'`,
          data: null,
          usedFallback: false
        };
      }

      // Extract local Y/M/D
      const year  = parsed.getFullYear();
      const month = parsed.getMonth();
      const day   = parsed.getDate();

      // Build that day's window
      const startOfDay = new Date(year, month, day, 0,   0,   0,   0);
      const endOfDay   = new Date(year, month, day, 23, 59, 59, 999);

      console.log(
        `>>> [DEBUG] Filtering for events between ${startOfDay.toISOString()} and ${endOfDay.toISOString()}`
      );

      // Enhanced overlap logic to include both regular and recurring events
      matchCondition = {
        $or: [
          // Regular events
          { "date.from": { $lte: endOfDay }, "date.to": { $gte: startOfDay } },
          // Recurring events
          { "recurring": true, "recurringDates": { $elemMatch: { "from": { $lte: endOfDay }, "to": { $gte: startOfDay } } } }
        ]
      };
      console.log("[33m[39m[33m[39m [DEBUG] Enhanced date filter matchCondition:", JSON.stringify(matchCondition, null, 2));
    }

    // 4. Apply mode filter if requested
    if (mode !== "both") {
      matchCondition.mode = mode;
      console.log(">>> [DEBUG] Applied mode filter. matchCondition now:", JSON.stringify(matchCondition, null, 2));
    }

    // 5. Apply searchQuery filter for event titles
    if (searchQuery && searchQuery.trim() !== "") {
      console.log(">>> [DEBUG] Applying searchQuery filter for:", searchQuery);
      
      // Simplify to avoid aggregation complexity
      const trimmedQuery = searchQuery.trim();
      
      console.log(">>> [DEBUG] Trimmed query:", trimmedQuery);
      
      // Use simple partial match - just search for the main words
      const searchWords = trimmedQuery.replace(/[()]/g, '').trim();
      const simplePattern = searchWords.split(' ').slice(0, 3).join('.*');
      
      console.log(">>> [DEBUG] Simple pattern:", simplePattern);
      
      // Apply simple title filter
      matchCondition.title = {
        $elemMatch: {
          $regex: simplePattern,
          $options: "i"
        }
      };
      
      console.log(">>> [DEBUG] Added title filter. matchCondition now:", JSON.stringify(matchCondition, null, 2));
    }

    // 6. Build aggregation pipeline
    console.log(">>> [DEBUG] Building aggregation pipeline...");
    let pipeline;
    let usedFallback = false;
    // The rest of the aggregation pipeline (after geo/match)
    const restPipeline = [
      // Lookup creator
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
          pipeline: [{ $project: { name: 1, email: 1,mobileNo:1 } }],
        },
      },
      // Lookup teachers
      {
        $lookup: {
          from: "users",
          localField: "teachers",
          foreignField: "_id",
          as: "teachersDetails",
          pipeline: [{ $project: { name: 1 ,      profileImage: 1,mobileNo:1,email:1} }],
        },
      },
      // Lookup participants
      {
        $lookup: {
          from: "users",
          localField: "notifyTo",
          foreignField: "_id",
          as: "participantsDetails",
          pipeline: [
            {
              $project: {
                _id:          1,
                name:         1,
                email:        1,
                profileImage: 1,
                userName:     1,
                role:         1,
                status:       1,
              },
            },
          ],
        },
      },
      // Handle recurring events - find next upcoming occurrence
      {
        $addFields: {
          effectiveDate: {
            $cond: {
              if: { $and: [ 
                { $eq: ["$recurring", true] }, 
                { $gt: [{ $size: { $ifNull: ["$recurringDates", []] } }, 0] }
              ]},
              then: {
                $let: {
                  vars: {
                    upcomingDates: {
                      $filter: {
                        input: "$recurringDates",
                        as: "datePair",
                        cond: { $gte: ["$$datePair.to", new Date()] }
                      }
                    }
                  },
                  in: {
                    $cond: {
                      if: { $gt: [{ $size: "$$upcomingDates" }, 0] },
                      then: { $arrayElemAt: ["$$upcomingDates", 0] },
                      else: { $arrayElemAt: ["$recurringDates", 0] }
                    }
                  }
                }
              },
              else: "$date"
            }
          },
          // For recurring events, only show the next occurrence
          isNextOccurrence: {
            $cond: {
              if: { $and: [ 
                { $eq: ["$recurring", true] }, 
                { $gt: [{ $size: { $ifNull: ["$recurringDates", []] } }, 0] }
              ]},
              then: true,
              else: false
            }
          }
        }
      },
      // Update the date field with the effective date
      {
        $addFields: {
          date: "$effectiveDate"
        }
      },
      // Filter events based on date criteria if provided - but we already filtered in the initial match
      // Don't apply additional date filtering here since we already matched in the first stage
      ...(date ? [] : [{
        $match: {
          "date.to": { $gte: startOfToday }
        }
      }]),
      // For recurring events, group by event ID to keep only the next occurrence
      {
        $group: {
          _id: {
            eventId: "$_id",
            isRecurring: "$recurring"
          },
          event: { $first: "$$ROOT" },
          // For recurring events, find the earliest upcoming date
          nextDate: {
            $min: {
              $cond: [
                { $eq: ["$recurring", true] },
                "$date.from",
                null
              ]
            }
          }
        }
      },
      // Replace root with the event data
      {
        $replaceRoot: { newRoot: "$event" }
      },
      // Unwind durations and group by each slot (restore original behavior for duration slots)
      { $unwind: "$duration" },
      {
        $group: {
          _id: "$duration.from",
          events: {
            $push: {
              _id:               "$_id",
              title:             "$title",
              participantsDetails: {
                $map: {
                  input: "$participantsDetails",
                  as: "p",
                  in: {
                    _id:          "$$p._id",
                    name:         "$$p.name",
                    email:        "$$p.email",
                    profileImage: "$$p.profileImage",
                    userName:     "$$p.userName",
                    role:         "$$p.role",
                    status:       "$$p.status",
                  },
                },
              },
              mode:            "$mode",
              aol:             "$aol",
              userId:          "$userId",
              dateFrom:        "$date.from",
              dateTo:          "$date.to",
              userDetails:     "$userDetails",
              teachersDetails: "$teachersDetails",
              durationFrom:    "$duration.from",
              durationTo:      "$duration.to",
              meetingLink:     "$meetingLink",
              meetingId:       "$meetingId",
              recurring:       "$recurring",
              profileImage:    "$profileImage",
              description:     "$description",
              address:         "$address",
              location:        "$location",
              phoneNumber:     "$phoneNumber",
              registrationLink:"$registrationLink",
              notifyTo:        "$notifyTo",
            }
          }
        }
      },
      // Sort by slot start, then paginate
      { $sort: { _id: 1 } },
      { $skip: (page - 1) * pageSize },
      { $limit: parseInt(pageSize, 10) },
      // Final projection
      {
        $project: {
          _id:    0,
          from:   "$_id",
          events: 1
        }
      }
    ];
    // If both latitude and longitude are provided, use $geoNear
    if (latitude && longitude) {
      pipeline = [
        {
          $geoNear: {
            near: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] },
            distanceField: "distance",
            maxDistance: parseFloat(radius) * 1000,
            spherical: true,
            query: matchCondition
          }
        },
        ...restPipeline
      ];
    } else {
      pipeline = [
        { $match: matchCondition },
        ...restPipeline
      ];
    }
    console.log(">>> [DEBUG] Aggregation pipeline defined.");

    // 7. Execute aggregation and count
    console.log(">>> [DEBUG] Executing Event.aggregate...");

    // Debug: Show some events before filtering to see what data exists
    if (searchQuery && searchQuery.trim() !== "") {
      console.log(">>> [DEBUG] === BEFORE FILTERING DEBUG ===");
      const debugEvents = await Event.find({}).limit(5).select('title date');
      console.log(">>> [DEBUG] Sample events in database:");
      debugEvents.forEach((event, index) => {
        console.log(`   ${index + 1}. Title: ${JSON.stringify(event.title)}, Date: ${event.date}`);
      });
      console.log(">>> [DEBUG] Looking for title containing: \"", searchQuery, "\"");
      console.log(">>> [DEBUG] === END DEBUG ===");
    }

    // 7A. Get events with valid coordinates (main pipeline)
    let results = await Event.aggregate(pipeline);
    console.log(`>>> [DEBUG] Retrieved ${results.length} individual events (with valid coordinates)`);

    // 7B. Get events missing or with invalid coordinates
    let invalidLocationQuery = {
      ...matchCondition,
      $or: [
        { "location": { $exists: false } },
        { "location": null },
        { "location.coordinates": { $exists: false } },
        { "location.coordinates": { $not: { $type: "array" } } },
        { $expr: { $ne: [ { $size: "$location.coordinates" }, 2 ] } }
      ]
    };
    let invalidEvents = await Event.find(invalidLocationQuery).lean();
    console.log(`>>> [DEBUG] Retrieved ${invalidEvents.length} events with missing/invalid coordinates`);

    // 7C. Merge both arrays for frontend
    // For consistency, wrap invalid events in the same grouping structure if needed
    // We'll add them as a special group '_invalid' or append to the first group
    if (invalidEvents.length > 0) {
      // If results is an array of groups: [{from, events: [...]}, ...]
      if (Array.isArray(results) && results.length > 0 && results[0].events) {
        // Add to a special group
        results.push({ from: '_invalid', events: invalidEvents });
      } else if (Array.isArray(results)) {
        // If results is just a flat array, concat
        results = results.concat(invalidEvents);
      } else {
        results = invalidEvents;
      }
    }
    
    
    // Debug: Show what was actually matched
    if (results.length === 0 && (searchQuery || date)) {
      console.log(">>> [DEBUG] === NO RESULTS DEBUG ===");
      console.log(">>> [DEBUG] No results found with current filters.");
      console.log(">>> [DEBUG] Match condition was:", JSON.stringify(matchCondition, null, 2));
      
      // Test if removing individual filters helps
      if (searchQuery) {
        const testWithoutTitle = { ...matchCondition };
        delete testWithoutTitle.title;
        const testResults = await Event.find(testWithoutTitle).limit(3).select('title date');
        console.log(`>>> [DEBUG] Events without title filter (${testResults.length} found):`);
        testResults.forEach((event, index) => {
          console.log(`   ${index + 1}. Title: ${JSON.stringify(event.title)}, Date: ${event.date}`);
        });
      }
      
      console.log(">>> [DEBUG] === END NO RESULTS DEBUG ===");
    }

    // If no results found, try fallback strategies
    if (results.length === 0) {
      console.log(">>> [DEBUG] === TRYING FALLBACK STRATEGIES ===");
      
      // Strategy 1: If both date and search filters applied, try with just search filter
      if (searchQuery && date) {
        console.log(">>> [DEBUG] Trying with just search filter (removing date filter)");
        const fallbackCondition = { ...matchCondition };
        delete fallbackCondition['date.from'];
        delete fallbackCondition['date.to'];
        
        const fallbackPipeline = latitude && longitude ? [
          {
            $geoNear: {
              near: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] },
              distanceField: "distance",
              maxDistance: parseFloat(radius) * 1000,
              spherical: true,
              query: fallbackCondition
            }
          },
          ...restPipeline
        ] : [
          { $match: fallbackCondition },
          ...restPipeline
        ];
        
        results = await Event.aggregate(fallbackPipeline);
        if (results.length > 0) {
          console.log(`>>> [DEBUG] Found ${results.length} events with search filter only`);
          usedFallback = true;
        }
      }
      
      // Strategy 2: If still no results and geo filter was used, try without geo
      if (results.length === 0 && latitude && longitude) {
        console.log(">>> [DEBUG] Trying without geo filter");
        const pipeline = [
          { $match: matchCondition },
          ...restPipeline
        ];
        results = await Event.aggregate(pipeline);
        if (results.length > 0) {
          console.log(`>>> [DEBUG] Found ${results.length} events without geo filter`);
          usedFallback = true;
        }
      }
      
      console.log(">>> [DEBUG] === END FALLBACK STRATEGIES ===");
    }

    console.log(">>> [DEBUG] Counting total documents with matchCondition...");
    const totalCount = await Event.countDocuments(matchCondition);
    console.log(">>> [DEBUG] Total matching events count:", totalCount);

    return {
      success: true,
      data: results,
      pagination: {
        currentPage: page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      usedFallback
    };


  } catch (error) {
    console.error(">>> [ERROR] getEvents failed:", error);
    return {
      success: false,
      message: error.message,
      data: null
    };
  }
}


const getNotification = async (request) => {
  return await Notification.find({ to: request.user.id }).sort({ _id: -1 });
};

const notificatifyMe = async (request) => {
  const userId = request.user.id;
  console.log(`User ID: ${userId} is attempting to subscribe to event notifications.`);

  let event = await Event.findById(request.params.id);
  if (!event) {
    console.log(`Event not found for ID: ${request.params.id}`);
    throw new appError(httpStatus.CONFLICT, request.t("event.EVENT_NOT_FOUND"));
  }

  console.log(`Event found: ${event.title} (Event ID: ${event._id})`);

  if (!event.notifyTo.includes(userId)) {
    console.log(`User ID: ${userId} is not yet in the notification list for event: ${event.title}. Adding...`);

    // Add user to the notification list
    event = await Event.findByIdAndUpdate(
      request.params.id,
      {
        $push: { notifyTo: userId },
      },
      { new: true }
    );

    console.log(`User ID: ${userId} added to the notification list for event: ${event.title}.`);

    // Send notifications after adding the user to the list
    await sendNotifications(event.notifyTo, event);
    console.log(`Notifications sent to all users in the notifyTo list for event: ${event.title}.`);
  } else {
    console.log(`User ID: ${userId} is already in the notification list for event: ${event.title}.`);
  }

  return event;
};


const sendNotifications = async (userIds, event) => {
  for (const userId of userIds) {
    const user = await User.findById(userId);
    if (user) {
      const eventDate = {
        from: event.date.from,
        to: event.date.to,
      };

      const meetingLink = event.meetingLink; // Make sure this field exists in your event object
      const duration = {
        from: event.duration[0].from, // Assuming duration is an array and you're taking the first item
        to: event.duration[0].to,
      };

      const notificationToUser = new Notification({
        userId: userId,
        eventId: event._id,
        message: `You have a new notification regarding the event.`,
        profileImage: user.profileImage,
        eventDate: eventDate,
        meetingLink: meetingLink,
        duration: duration,
      });

      await notificationToUser.save();
    }
  }
};



const subscribeToEvent = async (eventId, userId, userName) => {
  const event = await Event.findById(eventId);

  if (!event) {
    throw new appError(httpStatus.NOT_FOUND, "Event not found");
  }

  if (!event.subscribers.some(sub => sub.userId.toString() === userId.toString())) {
    event.subscribers.push({ userId, name: userName });
    await event.save();
  }

  await Subscription.create({
    userId,
    eventId,
    name: userName
  });

  return { event, subscription: { userId, eventId, name: userName } };
};

const getSubscribersByEventId = async (eventId) => {
  console.log(`Fetching event with ID: ${eventId}`);

  const event = await Event.findById(eventId).populate("participants", "name");

  if (!event) {
    console.log(`Event not found for ID: ${eventId}`);
    throw new appError(httpStatus.NOT_FOUND, "Event not found");
  }


  console.log(`Event found:`, event);
  console.log(`Participants:`, event.participants);

  const subscribers = event.participants.map(user => ({
    userId: user._id,
    name: user.name,
  }));

  console.log(`Subscribers list:`, subscribers);

  return subscribers;
};

const getAllEventsService = async (longitude, latitude, maxDistance = 200000) => {
  try {
    let query = {};
    
    // If coordinates are provided, try to find events within radius first
    if (longitude !== undefined && latitude !== undefined) {
      query = {
        location: {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude]
            },
            $maxDistance: maxDistance // 200km in meters
          }
        }
      };
      
      // First try to find events within radius
      let events = await Event.find(query)
        .populate('userId', 'name email profileImage')
        .populate('teachers', 'name email profileImage')
        .sort({ 'date.from': 1 });
      
      // If no events found within radius, return all events
      if (!events || events.length === 0) {
        events = await Event.find({})
          .populate('userId', 'name email profileImage')
          .populate('teachers', 'name email profileImage')
          .sort({ 'date.from': 1 });
      }
      
      return events;
    } else {
      // If no coordinates provided, return all events
      return await Event.find({})
        .populate('userId', 'name email profileImage')
        .populate('teachers', 'name email profileImage')
        .sort({ 'date.from': 1 });
    }
  } catch (error) {
    console.error('Error in getAllEventsService:', error);
    throw error;
  }
};

const getNearbyEventsService = async (longitude, latitude, radius) => {
  try {
    let events;
    if (longitude && latitude && radius) {
      events = await Event.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: parseFloat(radius)
          }
        }
      })
      .limit(1000) // Increased limit to 1000 to ensure all markers are returned
      .select("title location mode aol date duration address");
    } else {
      events = await Event.find({})
        .select("title location mode aol date duration address");
    }
    return events;
  } catch (error) {
    throw new Error("Error fetching events: " + error.message);
  }
};

async function manageTitles(request, action) {
  console.log(`\x1b[35m%s\x1b[0m`, `Managing titles with action: ${action}`);
  
  const Title = require('../../models/title');
  const userId = request.user.id;
  
  switch(action) {
    case 'create':
      if (!request.body.title || typeof request.body.title !== 'string') {
        throw new appError(httpStatus.BAD_REQUEST, "Title is required and must be a string");
      }
      
      // Check if title already exists for this user
      const existingTitle = await Title.findOne({ 
        title: request.body.title,
        createdBy: userId
      });
      if (existingTitle) {
        throw new appError(httpStatus.CONFLICT, "Title already exists");
      }

      const newTitle = await Title.create({
        title: request.body.title,
        createdBy: userId
      });

      // Get current titles for this user
      const currentTitles = await Title.find({
        createdBy: userId,
        isActive: true
      }).sort({ title: 1 });

      return {
        success: true,
        message: "Title added successfully",
        title: newTitle.title,
        titles: currentTitles.map(doc => doc.title)
      };
      
    case 'get':
      // Get titles created by the current user
      const query = { 
        isActive: true,
        createdBy: new ObjectId(userId)
      };
      
      const titleDocs = await Title.find(query).sort({ title: 1 });
      const titles = titleDocs.map(doc => doc.title);
      
      return {
        success: true,
        titles
      };
      
    case 'delete':
      if (!request.body.title || typeof request.body.title !== 'string') {
        throw new appError(httpStatus.BAD_REQUEST, "Title is required and must be a string");
      }
      
      // Find and delete the title (only if it belongs to the current user)
      const titleToDelete = await Title.findOneAndDelete({
        title: request.body.title,
        createdBy: userId,
        isActive: true
      });
      
      if (!titleToDelete) {
        throw new appError(httpStatus.NOT_FOUND, "Title not found or you don't have permission to delete it");
      }
      
      // Get updated titles list for this user
      const remainingTitles = await Title.find({
        createdBy: userId,
        isActive: true
      }).sort({ title: 1 });
      
      return {
        success: true,
        message: "Title deleted successfully",
        deletedTitle: titleToDelete.title,
        titles: remainingTitles.map(doc => doc.title)
      };
      
    case 'update':
      if (!request.body.oldTitle || typeof request.body.oldTitle !== 'string') {
        throw new appError(httpStatus.BAD_REQUEST, "Old title is required and must be a string");
      }
      if (!request.body.newTitle || typeof request.body.newTitle !== 'string') {
        throw new appError(httpStatus.BAD_REQUEST, "New title is required and must be a string");
      }
      
      // Check if new title already exists for this user (excluding the current title)
      const duplicateTitle = await Title.findOne({
        title: request.body.newTitle,
        createdBy: userId,
        isActive: true,
        title: { $ne: request.body.oldTitle }
      });
      
      if (duplicateTitle) {
        throw new appError(httpStatus.CONFLICT, "New title already exists");
      }
      
      // Update the title
      const updatedTitle = await Title.findOneAndUpdate(
        {
          title: request.body.oldTitle,
          createdBy: userId,
          isActive: true
        },
        { 
          title: request.body.newTitle,
          updatedAt: new Date()
        },
        { new: true }
      );
      
      if (!updatedTitle) {
        throw new appError(httpStatus.NOT_FOUND, "Title not found or you don't have permission to update it");
      }
      
      // Get updated titles list for this user
      const updatedTitles = await Title.find({
        createdBy: userId,
        isActive: true
      }).sort({ title: 1 });
      
      return {
        success: true,
        message: "Title updated successfully",
        oldTitle: request.body.oldTitle,
        newTitle: updatedTitle.title,
        titles: updatedTitles.map(doc => doc.title)
      };
      
    default:
      throw new appError(httpStatus.BAD_REQUEST, "Invalid action requested");
  }
}
async function getTeacherEvents(request) {
  try {
    console.log(">>> [DEBUG] Entered getTeacherEvents");
    const { page = 1, pageSize = 10 } = request.body;
    const skip = (page - 1) * pageSize;
    const userId = new ObjectId(request.user.id);

    // Get total count for pagination
    const totalCount = await Event.countDocuments({ userId });

    const pipeline = [
      // Match events created by this teacher
      { $match: { userId } },

      // Lookup stages remain the same
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
          pipeline: [{ $project: { name: 1, email: 1,profileImage:1 } }]
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "teachers",
          foreignField: "_id",
          as: "teachersDetails",
          pipeline: [{ $project: { name: 1 ,profileImage:1 } }]
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "notifyTo",
          foreignField: "_id",
          as: "participantsDetails",
          pipeline: [
            { $project: { name: 1, email: 1, profileImage: 1, userName: 1 } }
          ]
        }
      },

      // Add sort by date
      { $sort: { "date.from": -1 } },

      // Add pagination
      { $skip: skip },
      { $limit: parseInt(pageSize) }
    ];

    const results = await Event.aggregate(pipeline);
    console.log(`>>> [DEBUG] Found ${results.length} events`);

    return {
      events: results,
      pagination: {
        currentPage: page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    };
  } catch (error) {
    console.error(">>> [ERROR] getTeacherEvents failed:", error);
    throw error;
  }
}

async function getUserProfile(request) {
  try {
    console.log(">>> [DEBUG] Entered getUserProfile");
    // Destructure and coerce page and pageSize to integers
    const { userId, page = 1, pageSize = 10 } = request.body;
    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = parseInt(pageSize, 10) || 10;
    let targetUserId;
    
    // Determine which profile to fetch
    if (userId) {
      targetUserId = new ObjectId(userId);
    } else {
      targetUserId = new ObjectId(request.user.id);
    }

    // Fetch basic user details
    const user = await User.aggregate([
      { $match: { _id: targetUserId } },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          mobileNo: 1,
          profileImage: 1,
          role: 1,
          teacherRoleApproved: 1,
          showContact: { $ifNull: ["$showContact", true] }  // Default to true if not set
        }
      }
    ]);

    if (!user || user.length === 0) {
      throw new appError(httpStatus.NOT_FOUND, "User not found");
    }

    let userProfile = user[0];
    
    // Handle contact info visibility
    if (!userProfile.showContact) {
      userProfile = {
        ...userProfile,
        email: null,
        mobileNo: null
      };
    }
    console.log(`>>> [DEBUG] Contact info visibility - User: ${userProfile._id}, Show Contact: ${userProfile.showContact}, Has Email: ${!!userProfile.email}, Has Mobile: ${!!userProfile.mobileNo}`);
    
    // Prepare userInfo for response
    const userInfo = {
      _id: userProfile._id,
      name: userProfile.name,
      email: userProfile.email,
      mobileNo: userProfile.mobileNo,
      profileImage: userProfile.profileImage,
      role: userProfile.role,
      teacherRoleApproved: userProfile.teacherRoleApproved,
      showContact: userProfile.showContact
    };

    const skip = (pageNum - 1) * pageSizeNum;
    let events = [];
    let titles = [];
    let totalCount = 0;

    // Fetch both events created by this user and events the user is subscribed to, for ANY role
    // Created events
    const createdEventsPipeline = [
      { $match: { userId: targetUserId } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
          pipeline: [{ $project: { name: 1, email: 1, mobileNo: 1, profileImage: 1, showContact: 1 } }]
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "teachers",
          foreignField: "_id",
          as: "teachersDetails",
          pipeline: [{ $project: { name: 1, profileImage: 1, mobileNo: 1, email: 1 } }]
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "notifyTo",
          foreignField: "_id",
          as: "participantsDetails",
          pipeline: [{ $project: { name: 1, email: 1, profileImage: 1, userName: 1, mobileNo: 1 } }]
        }
      },
      { $sort: { "date.from": -1 } },
      { $skip: skip },
      { $limit: pageSizeNum }
    ];
    const createdEvents = await Event.aggregate(createdEventsPipeline);

    // Subscribed events
    const subscribedEventsPipeline = [
      { $match: { notifyTo: targetUserId } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
          pipeline: [{ $project: { name: 1, email: 1, profileImage: 1, mobileNo: 1 } }]
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "teachers",
          foreignField: "_id",
          as: "teachersDetails",
          pipeline: [{ $project: { name: 1, profileImage: 1, mobileNo: 1, email: 1 } }]
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "notifyTo",
          foreignField: "_id",
          as: "participantsDetails",
          pipeline: [{ $project: { name: 1, email: 1, profileImage: 1, userName: 1, mobileNo: 1 } }]
        }
      },
      { $sort: { "date.from": -1 } },
      { $skip: skip },
      { $limit: pageSizeNum }
    ];
    const subscribedEvents = await Event.aggregate(subscribedEventsPipeline);

    // Fetch titles for this user (if any)
    const Title = require('../../models/title');
    const titleDocs = await Title.find(
      { isActive: true, createdBy: targetUserId }
    ).sort({ title: 1 });
    titles = titleDocs.map(doc => doc.title);
    if (!titles.includes('Happy blessing')) {
      titles.unshift('Happy blessing');
    }

    // Combine totalCount as sum of both lists (optionally you can return separate counts)
    totalCount = createdEvents.length + subscribedEvents.length;

    console.log(`>>> [DEBUG] Found ${createdEvents.length} created events and ${subscribedEvents.length} subscribed events for user`);

    // Return both lists and titles
    return {
      user: userInfo,
      createdEvents,
      subscribedEvents,
      titles,
      pagination: {
        currentPage: pageNum,
        pageSize: pageSizeNum,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSizeNum)
      }
    };
  } catch (error) {
    console.error(">>> [ERROR] getUserProfile failed:", error);
    throw error;
  }
}



const getParticepents = async (request) => {
  try {
    console.log('getParticepents service called with event ID:', request.params.id);
    
    if (!request.params.id) {
      throw new appError(httpStatus.BAD_REQUEST, "Event ID is required");
    }

    const result = await Event.aggregate([
      { $match: { _id: new ObjectId(request.params.id) } },
      {
        $lookup: {
          from: "users",
          localField: "notifyTo",
          foreignField: "_id",
          as: "participantsDetails",
          pipeline: [{ $project: { name: 1, email: 1, profileImage: 1, userName: 1 } }],
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          notifyTo: 1,
          participantsDetails: 1
        }
      }
    ]);

    console.log('Aggregation result:', {
      resultType: Array.isArray(result) ? 'array' : typeof result,
      resultLength: Array.isArray(result) ? result.length : 'N/A',
      hasData: result && result.length > 0
    });

    // Convert notifyTo to array of strings for frontend compatibility
    if (result && result.length > 0) {
      const event = result[0];
      if (event.notifyTo && Array.isArray(event.notifyTo)) {
        event.notifyTo = event.notifyTo.map(id => id.toString());
      }
      
      // Ensure participantsDetails is always an array
      if (!event.participantsDetails) {
        event.participantsDetails = [];
      }
    }

    console.log('getParticepents final result:', {
      resultType: Array.isArray(result) ? 'array' : typeof result,
      resultLength: Array.isArray(result) ? result.length : 'N/A',
      hasNotifyTo: result && result.length > 0 ? !!result[0].notifyTo : false,
      notifyToLength: result && result.length > 0 && result[0].notifyTo ? result[0].notifyTo.length : 0,
      participantsCount: result && result.length > 0 && result[0].participantsDetails ? result[0].participantsDetails.length : 0
    });

    return result;
  } catch (error) {
    console.error('Error in getParticepents:', error);
    throw error;
  }
};

async function getTeacherTitles(userId) {
  try {
    const Title = require('../../models/title');
    
    const titleDocs = await Title.find({
      isActive: true,
      createdBy: new ObjectId(userId)
    }).sort({ title: 1 });
    
    return {
      success: true,
      message: 'Titles fetched successfully',
      data: {
        titles: titleDocs.map(doc => ({
          title: doc.title,
          createdBy: doc.createdBy.toString()
        }))
      
      }
    }
  } catch (error) {
    console.error('Error fetching teacher titles:', error);
    throw new appError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch titles"); 
  }
}

module.exports = {

  createEvent,
  editEvent,
  manageTitles,
  deleteEvent,
  getEvent,
  getAllEvents,
  getParticepents,
  getNotification,
  notificatifyMe,

  subscribeToEvent,
  getSubscribersByEventId,
  getAllEventsService,
  getNearbyEventsService,
  getTeacherEvents,
  getUserProfile,
  getTeacherTitles,
};
