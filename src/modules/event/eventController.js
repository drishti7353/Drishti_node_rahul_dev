const eventService = require("./eventService");
const Event = require("../../models/event");
const appError = require("../../common/utils/appError");
const httpStatus = require("../../common/utils/status.json");
const createResponse = require("../../common/utils/createResponse");

const { distortCoordinates } = require("../../common/utils/helpers");
const { RRule } = require("rrule");
const Notification = require("../../models/notification");
const moment = require('moment-timezone');
const User = require("../../models/user");

// Helper: get start of day and next day (for date filtering)
function getStartOfDayAndNextDay(dateInput) {
  const dateObj = new Date(dateInput);
  const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));
  const nextDay = new Date(startOfDay);
  nextDay.setDate(nextDay.getDate() + 1);
  return [startOfDay.toISOString(), nextDay.toISOString()];
}

// Helper: generate recurring dates using rrule
// recurrence: object containing freq, interval, count, until, etc.
// startDate and endDate define the range in which to generate occurrences
function generateRecurringDates(recurrence, startDate, endDate) {
  const freqMapping = {
    DAILY: RRule.DAILY,
    WEEKLY: RRule.WEEKLY,
    MONTHLY: RRule.MONTHLY,
    YEARLY: RRule.YEARLY,
  };

  const options = {
    freq: freqMapping[recurrence.freq] || RRule.DAILY,
    interval: recurrence.interval || 1,
    dtstart: new Date(startDate),
  };

  if (recurrence.count) {
    options.count = recurrence.count;
  }
  if (recurrence.until) {
    options.until = new Date(recurrence.until);
  }

  const rule = new RRule(options);
  // You can use rule.all() or rule.between() with a defined range.
  return rule.between(new Date(startDate), new Date(endDate));
}

// Note: This function is removed - we now use recurringDates array instead of separate event instances

// Helper function to schedule notifications for recurring events
async function scheduleRecurringNotifications(eventId, eventData) {
  const event = await Event.findById(eventId).populate('notifyTo');
  if (!event || !event.recurring) return;

  const reminderTimes = [
    { minutes: 1440, message: "24 hours", isOneHourReminder: false },
    { minutes: 60, message: "1 hour", isOneHourReminder: true }
  ];

  const startDate = new Date(eventData.date.from);
  const endDate = new Date(eventData.date.to);

  const rule = new RRule({
    freq: RRule[eventData.recurrence.frequency],
    interval: eventData.recurrence.interval,
    until: new Date(eventData.recurrence.until),
    dtstart: startDate
  });

  const occurrences = rule.between(startDate, endDate);

  for (const occurrence of occurrences) {
    for (const reminder of reminderTimes) {
      const reminderTime = new Date(occurrence.getTime() - (reminder.minutes * 60 * 1000));

      if (reminderTime > new Date()) {
        await Notification.create({
          title: `Event Reminder: ${event.title[0]}`,
          description: `${event.title[0]} will start in ${reminder.message}`,
          user: event.notifyTo.map(user => user._id),
          event: eventId,
          type: "reminder",
          status: "pending",
          scheduledTime: reminderTime,
          isOneHourReminder: reminder.isOneHourReminder,
          processed: false
        });
      }
    }
  }
}

// Create Event: Supports recurring events using recurringDates array
async function createEvent(request) {
  try {
    const event = await eventService.createEvent(request);
    
    createResponse(
      request.res,
      httpStatus.OK,
      "Event created",
      event
    );
  } catch (error) {
    console.error('Create event error:', error);
    createResponse(
      request.res,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
}

// Edit Event: Supports recurring events using recurringDates array
async function editEvent(request) {
  try {
    const event = await eventService.editEvent(request);
    
    createResponse(
      request.res,
      httpStatus.OK,
      "Event updated",
      event
    );
  } catch (error) {
    console.error('Edit event error:', error);
    createResponse(
      request.res,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
}


// Delete Event remains unchanged.
async function deleteEvent(request) {
  return await Event.findByIdAndDelete(request.params.id);
}

// Get recurring meetings for a course/event
const getRecurringMeetings = async (request, response) => {
  try {
    const { eventId } = request.params;
    const { limit = 10 } = request.query;
    const currentDate = new Date();
    
    console.log(`Getting recurring meetings for event: ${eventId}`);
    
    // Find the event first
    const event = await Event.findById(eventId)
      .select('_id title mode address location recurring recurringDates duration')
      .lean();
      
    if (!event) {
      return createResponse(response, httpStatus.NOT_FOUND, "Event not found");
    }
    
    console.log(`Found event: ${event.title}, recurring: ${event.recurring}`);
    console.log(`RecurringDates array length: ${event.recurringDates?.length || 0}`);
    
    let formattedMeetings = [];
    
    if (event.recurring && event.recurringDates && event.recurringDates.length > 0) {
      // Filter future recurring dates and sort them
      const futureDates = event.recurringDates
        .filter(dateRange => new Date(dateRange.to) >= currentDate)
        .sort((a, b) => new Date(a.from) - new Date(b.from))
        .slice(0, parseInt(limit));
      
      console.log(`Found ${futureDates.length} future recurring dates`);
      
      // Format each recurring date as a meeting
      formattedMeetings = futureDates.map((dateRange, index) => ({
        id: `${event._id}_${index}`, // Unique ID for each occurrence
        eventId: event._id, // Original event ID
        title: event.title,
        startDate: dateRange.from,
        endDate: dateRange.to,
        startTime: event.duration?.[0]?.from || null,
        endTime: event.duration?.[0]?.to || null,
        mode: event.mode,
        address: event.address,
        location: event.location,
        isRecurring: true,
        occurrenceIndex: index
      }));
    } else {
      // For non-recurring events or events without recurringDates, 
      // just return the event itself if it's in the future
      const eventDate = await Event.findById(eventId).select('date').lean();
      if (eventDate && new Date(eventDate.date.to) >= currentDate) {
        formattedMeetings = [{
          id: event._id,
          eventId: event._id,
          title: event.title,
          startDate: eventDate.date.from,
          endDate: eventDate.date.to,
          startTime: event.duration?.[0]?.from || null,
          endTime: event.duration?.[0]?.to || null,
          mode: event.mode,
          address: event.address,
          location: event.location,
          isRecurring: false,
          occurrenceIndex: 0
        }];
      }
    }
    
    console.log(`Returning ${formattedMeetings.length} formatted meetings`);
    
    return createResponse(
      response,
      httpStatus.OK,
      "Recurring meetings fetched successfully",
      {
        meetings: formattedMeetings,
        totalCount: formattedMeetings.length,
        hasMore: false // Since we're getting from a single event's recurringDates array
      }
    );
  } catch (error) {
    console.error('Get recurring meetings error:', error);
    return createResponse(
      response,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

const toggleEventSkip = async (request, response) => {
  try {
    const { eventId } = request.params;
    const { date } = request.body;
    const userId = request.user.id;

    // Find the event first to check current state
    const event = await Event.findById(eventId);
    if (!event) {
      return createResponse(response, httpStatus.NOT_FOUND, "Event not found");
    }

    // Ensure user has permission
    const isAuthorized = 
      event.userId.toString() === userId || 
      event.teachers.some(teacherId => teacherId.toString() === userId);

    if (!isAuthorized) {
      return createResponse(
        response,
        httpStatus.FORBIDDEN,
        "Not authorized to modify this event"
      );
    }

    // Format date consistently
    const dateKey = new Date(date).toISOString().split('T')[0];

    // Check if date is currently skipped
    const isCurrentlySkipped = event.skippedDates?.includes(dateKey);

    let updatedEvent;
    if (isCurrentlySkipped) {
      // Resume class - remove from skipped dates
      updatedEvent = await Event.findByIdAndUpdate(
        eventId,
        { $pull: { skippedDates: dateKey } },
        { new: true }
      );
      // Restore notification status for this event and date
      await Notification.updateMany(
        {
          event: eventId,
          $or: [
            { date: dateKey },
            { scheduledTime: { $gte: new Date(dateKey), $lt: new Date(new Date(dateKey).getTime() + 24*60*60*1000) } }
          ],
          status: "pause",
          previousStatus: { $exists: true }
        },
        [
          { $set: { status: { $ifNull: ["$previousStatus", "pending"] } } },
          { $unset: "previousStatus" }
        ]
      );
    } else {
      // Skip class - add to skipped dates
      updatedEvent = await Event.findByIdAndUpdate(
        eventId,
        { $addToSet: { skippedDates: dateKey } },
        { new: true }
      );
      // Pause all related notifications for this event and date for all users, saving previous status
      await Notification.updateMany(
        {
          event: eventId,
          $or: [
            { date: dateKey },
            { scheduledTime: { $gte: new Date(dateKey), $lt: new Date(new Date(dateKey).getTime() + 24*60*60*1000) } }
          ],
          status: { $ne: "pause" }
        },
        [
          { $set: { previousStatus: "$status", status: "pause" } }
        ]
      );
    }

    return createResponse(
      response,
      httpStatus.OK,
      isCurrentlySkipped ? "Event resumed for date" : "Event skipped for date",
      {
        isSkipped: !isCurrentlySkipped,
        date: dateKey,
        skippedDates: updatedEvent.skippedDates
      }
    );
  } catch (error) {
    console.error('Toggle Skip Error:', error);
    return createResponse(
      response,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

// Get a single event with user and teacher details.
const getEvent = async (request, response) => {
  try {
    const data = await eventService.getEvent(request);
    if (!data) {
      throw new appError(
        httpStatus.CONFLICT,
        request.t("event.UnableToCreateEvent")
      );
    }
    createResponse(
      response,
      httpStatus.OK,
      request.t("event.EventFetched"),
      data
    );
  } catch (error) {
    createResponse(response, error.status, error.message);
  }
};
// Get events with filtering; supports expansion of recurring occurrences.
const getAllEvents = async (request, response) => {
  try {
    const data = await eventService.getAllEvents(request);
    
    if (!data.success) {
      throw new appError(
        httpStatus.INTERNAL_SERVER_ERROR,
        data.message || "Failed to fetch events"
      );
    }

    createResponse(
      response, 
      httpStatus.OK,
      "Events fetched successfully",
      data
    );
  } catch (error) {
    console.error(">>> [ERROR] getEvents controller failed:", error);
    createResponse(
      response,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};
// Get events created by the authenticated user.
async function getMyEvents(request) {
  return await Event.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(request.user.id),
      },
    },
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
  ]);
}

// Basic stubs for other functions:

async function getHorizontalEvents(request) {
  return await Event.find({}).limit(10);
}

async function getParticepents(request) {
  return await Event.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(request.params.id) } },
    {
      $lookup: {
        from: "users",
        localField: "notifyTo",
        foreignField: "_id",
        as: "participantsDetails",
      },
    },
  ]).sort({ _id: -1 });
}

async function getAttendedEvents(request) {
  const { page = 1, limit = 10 } = request.query;
  const userObjectId = new mongoose.Types.ObjectId(request.user.id);
  const skip = (page - 1) * limit;
  return await Event.aggregate([
    { $match: { teachers: userObjectId, userId: { $ne: userObjectId } } },
    {
      $lookup: {
        from: "users",
        localField: "teachers",
        foreignField: "_id",
        as: "teacherDetails",
      },
    },
    { $skip: skip },
    { $limit: limit },
  ]);
}


const getSubscribersByEventId = async (eventId) => {
  const event = await Event.findById(eventId).populate("participants", "name");
  if (!event) {
    throw new appError(httpStatus.NOT_FOUND, "Event not found");
  }
  const subscribers = event.participants.map(user => ({
    userId: user._id,
    name: user.name,
  }));
  return subscribers;
};

const getAllEventsService = async (longitude, latitude, maxDistance) => {
  try {
    if (longitude && latitude && maxDistance) {
      // Create a geospatial query when coordinates are provided
      return await Event.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: parseInt(maxDistance) * 1609.34 // Convert miles to meters
          }
        }
      }).exec();
    } else {
      // Return all events if no coordinates provided
      return await Event.find({}).exec();
    }
  } catch (error) {
    console.error('Error in getAllEventsService:', error);
    throw new Error(`Error fetching events: ${error.message}`);
  }
};








const notificatifyMe = async (request, response) => {
  try {
    if (!request.user || !request.user.id) {
      throw new appError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const userId = request.user.id;
    const { eventId } = request.params;

    let event = await Event.findById(eventId);
    if (!event) {
      return response.status(404).json({ message: "Event not found." });
    }

    if (!event.participants.includes(userId) && !event.subscribers.includes(userId)) {
      const notification = await Notification.create({
        title: "No Active Events",
        description: "You are currently not registered for any upcoming events",
        userId: userId,
        eventId: event._id,
        status: "pending",
      });

      return createResponse(
        response,
        httpStatus.OK,
        "User is not part of any upcoming event",
        notification
      );
    }

    const notification = await Notification.create({
      title: `Event Notification: ${event.title}`,
      description: `Upcoming event: ${event.title}`,
      eventId: event._id,
      userId: userId,
      status: "pending",
    });

    createResponse(response, httpStatus.OK, "Notification created", notification);

  } catch (error) {
    createResponse(
      response,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "An error occurred"
    );
  }
};



const getParticepent = async (request, response) => {
  try {
    console.log('getParticepent called with event ID:', request.params.id);
    
    if (!request.params.id) {
      console.log('getParticepent: Missing event ID');
      return createResponse(
        response,
        httpStatus.BAD_REQUEST,
        "Event ID is required",
        { data: [] }
      );
    }
    
    const data = await eventService.getParticepents(request);
    
    // Add debug logging
    console.log('Controller response data:', {
      dataType: Array.isArray(data) ? 'array' : typeof data,
      dataLength: Array.isArray(data) ? data.length : 'N/A',
      firstItem: Array.isArray(data) && data.length > 0 ? data[0] : 'N/A'
    });

    // Return in the format Flutter expects: { data: [eventObject] }
    // The eventObject should have participantsDetails field
    let responseData;
    
    if (!data || (Array.isArray(data) && data.length === 0)) {
      // No event found or no participants - return empty array
      console.log('getParticepent: No data found');
      responseData = [];
    } else if (Array.isArray(data) && data.length > 0) {
      // Event found with participants - ensure all ObjectIds are converted to strings
      console.log('getParticepent: Processing array response');
      responseData = data.map(event => ({
        ...event,
        _id: event._id.toString(),
        notifyTo: Array.isArray(event.notifyTo) 
          ? event.notifyTo.map(id => id.toString())
          : [],
        participantsDetails: Array.isArray(event.participantsDetails)
          ? event.participantsDetails.map(p => ({
              ...p,
              _id: p._id.toString()
            }))
          : []
      }));
    } else {
      // Single object response - wrap in array and convert ObjectIds
      console.log('getParticepent: Processing single object response');
      responseData = [{
        ...data,
        _id: data._id.toString(),
        notifyTo: Array.isArray(data.notifyTo)
          ? data.notifyTo.map(id => id.toString())
          : [],
        participantsDetails: Array.isArray(data.participantsDetails)
          ? data.participantsDetails.map(p => ({
              ...p,
              _id: p._id.toString()
            }))
          : []
      }];
    }

    console.log('Final response data structure:', {
      isArray: Array.isArray(responseData),
      length: Array.isArray(responseData) ? responseData.length : 'N/A',
      hasEvent: responseData && responseData.length > 0,
      hasParticipants: responseData && responseData.length > 0 && responseData[0].participantsDetails,
      participantsCount: responseData && responseData.length > 0 ? responseData[0].participantsDetails?.length : 0
    });

    // Return in the format Flutter expects: { data: [eventObject] }
    return createResponse(
      response,
      httpStatus.OK,
      "Participants retrieved successfully",
      { data: responseData }
    );
  } catch (error) {
    console.error('Error in getParticepent:', error);
    createResponse(
      response, 
      error.status || httpStatus.INTERNAL_SERVER_ERROR, 
      error.message || "Failed to fetch participants",
      { data: [] }
    );
  }
};







const subscribeToEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { id, name } = req.body;

    if (!id || !name) {
      return res.status(400).json({ message: "User ID and name are required." });
    }

    let event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    if (!event.notifyTo.includes(id)) {
      event = await Event.findByIdAndUpdate(
        eventId,
        {
          $push: { notifyTo: id },
          $addToSet: { participants: { userId: id, name } }
        },
        { new: true }
      );
    }

    res.status(200).json({ message: "Subscription successful", event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSubscribers = async (req, res) => {
  try {
    const { eventId } = req.params;

    const subscribers = await eventService.getSubscribersByEventId(eventId);

    res.status(200).json(subscribers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNearEventController = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance } = req.body;
    let nearByEvents;
    if (longitude && latitude && maxDistance) {
      nearByEvents = await eventService.getAllEventsService(longitude, latitude, maxDistance);
    } else {
      nearByEvents = await eventService.getAllEventsService();
    }
    if (!nearByEvents || nearByEvents.length === 0) {
      return res.status(200).json({
        message: "No events found",
      });
    }
    return res.status(200).json({
      message: "Here are events",
      nearByEvents,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error finding events: ${error.message}`,
    });
  }
};

// Controller function to manage event titles
async function manageTitles(request, response) {
  try {
    // Extract action from request query parameter
    const action = request.query.action || 'get';
    //console.log(`Title management request with action: ${action}`);
    
    // Call service function to handle the title operation
    const result = await eventService.manageTitles(request, action);
    
    createResponse(
      response,
      httpStatus.OK,
      action === 'create' ? "Title created successfully" : "Titles retrieved successfully",
      result
    );
  } catch (error) {
    console.error("Error in manageTitles:", error);
    createResponse(
      response,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
}

// POST /event/titles
async function createTitle(request, response) {
  try {
    const result = await eventService.manageTitles(request, 'create');
    console.log('[DEBUG][createTitle] Service result:', result);
    // Flatten result into the top-level response
    return response.status(200).json({
      success: true,
      message: 'Title created successfully',
      title: result.title,
      titles: result.titles
    });
  } catch (error) {
    return response.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to create title'
    });
  }
}

const getTeacherEvents = async (request, response) => {
  try {
    const data = await eventService.getTeacherEvents(request);
    if (!data) {
      throw new appError(
        httpStatus.CONFLICT,
        "Unable to fetch teacher events"
      );
    }
    createResponse(
      response,
      httpStatus.OK,
      "Teacher events fetched successfully",
      data
    );
  } catch (error) {
    createResponse(
      response,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
}

const getUserProfile = async (request, response) => {
  try {
    const data = await eventService.getUserProfile(request);
    if (!data) {
      throw new appError(
        httpStatus.CONFLICT,
        "Unable to fetch user profile"
      );
    }
    createResponse(
      response,
      httpStatus.OK,
      "User profile fetched successfully",
      data
    );
  } catch (error) {
    createResponse(
      response,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
}

async function getParticipants(request) {
  try {
    const { id } = request.params;
    if (!id) {
      throw new appError(httpStatus.BAD_REQUEST, "Event ID is required");
    }
    
    return await Event.aggregate([
      { 
        $match: { 
          _id: new mongoose.Types.ObjectId(id) 
        } 
      },
      {
        $lookup: {
          from: "users",
          localField: "notifyTo",
          foreignField: "_id",
          as: "participantsDetails",
          pipeline: [
            { 
              $project: { 
                name: 1, 
                email: 1, 
                profileImage: 1, 
                userName: 1 
              } 
            }
          ],
        },
      },
      {
        $project: {
          participantsDetails: 1,
          notifyTo: 1
        }
      }
    ]).sort({ _id: -1 });
  } catch (error) {
    console.error("Error in getParticipants:", error);
    throw error;
  }
}

/**
 * Skip classes for an event
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const skipClasses = async (req, res) => {
  try {
    console.log('Skip Classes - Request body:', req.body);
    console.log('Skip Classes - Request user:', req.user);
    console.log('Skip Classes - Request params:', req.params);

    const { eventId } = req.params;
    const { date } = req.body;  // Get the specific date from request body
    
    // Validate date format
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or missing date parameter. Format should be YYYY-MM-DD' 
      });
    }

    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check authorization
    const isAuthorized = 
      event.userId.toString() === req.user.id || 
      (event.teachers && event.teachers.some(teacherId => teacherId.toString() === req.user.id));

    if (!isAuthorized) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to modify this event' 
      });
    }

    // Add the specific date to skipped dates if not already present
    if (!event.skippedDates.includes(date)) {
      event.skippedDates.push(date);
      await event.save();

      // Update notifications status to paused for this specific date
      await Notification.updateMany(
        {
          event: eventId,
          status: 'pending',
          scheduledTime: {
            $gte: new Date(date),
            $lt: new Date(new Date(date).getTime() + 24*60*60*1000)  // Next day
          }
        },
        { 
          status: 'pause',
          lastError: {
            message: 'Class skipped by teacher',
            time: new Date()
          }
        }
      );
    }

    res.json({ 
      success: true, 
      message: 'Class skipped successfully',
      data: { 
        skippedDates: event.skippedDates,
        date: date
      }
    });
  } catch (error) {
    console.error('Error in skipClasses:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to skip class',
      error: error.message 
    });
  }
};

/**
 * Resume classes for an event
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const resumeClasses = async (req, res) => {
  try {
    console.log('Resume Classes - Request body:', req.body);
    console.log('Resume Classes - Request user:', req.user);
    console.log('Resume Classes - Request params:', req.params);

    const { eventId } = req.params;
    const { date } = req.body;  // Get the specific date from request body
    
    // Validate date format
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or missing date parameter. Format should be YYYY-MM-DD' 
      });
    }

    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check authorization
    const isAuthorized = 
      event.userId.toString() === req.user.id || 
      (event.teachers && event.teachers.some(teacherId => teacherId.toString() === req.user.id));

    if (!isAuthorized) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to modify this event' 
      });
    }

    // Remove the specific date from skipped dates
    const dateIndex = event.skippedDates.indexOf(date);
    if (dateIndex !== -1) {
      event.skippedDates.splice(dateIndex, 1);
      await event.save();

      // Reactivate notifications for this specific date
      await Notification.updateMany(
        {
          event: eventId,
          status: 'pause',
          scheduledTime: {
            $gte: new Date(date),
            $lt: new Date(new Date(date).getTime() + 24*60*60*1000)  // Next day
          }
        },
        { 
          status: 'pending',
          lastError: {
            message: 'Class resumed by teacher',
            time: new Date()
          }
        }
      );
    }

    res.json({ 
      success: true, 
      message: 'Class resumed successfully',
      data: { 
        skippedDates: event.skippedDates,
        date: date
      }
    });
  } catch (error) {
    console.error('Error in resumeClasses:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to resume class',
      error: error.message 
    });
  }
};
// CONTROLLER - Add this function
async function deleteTitle(request, response) {
  try {
    const result = await eventService.manageTitles(request, 'delete');
    console.log('[DEBUG][deleteTitle] Service result:', result);
    
    return response.status(200).json({
      success: true,
      message: 'Title deleted successfully',
      deletedTitle: result.deletedTitle,
      titles: result.titles
    });
  } catch (error) {
    console.error("Error in deleteTitle:", error);
    return response.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to delete title'
    });
  }
}


const toggleContactVisibility = async (request, response) => {
  try {
    const userId = request.user.id;
    const { showContact } = request.body;

    if (typeof showContact !== 'boolean') {
      return response.status(httpStatus.BAD_REQUEST).json(
        createResponse(false, null, 'showContact must be a boolean')
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { showContact },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return response.status(httpStatus.NOT_FOUND).json(
        createResponse(false, null, 'User not found')
      );
    }

    return response.status(httpStatus.OK).json(
      createResponse(true, { showContact: updatedUser.showContact }, 'Contact visibility updated successfully')
    );
  } catch (error) {
    console.error('Error toggling contact visibility:', error);
    return response.status(httpStatus.INTERNAL_SERVER_ERROR).json(
      createResponse(false, null, 'Failed to update contact visibility')
    );
  }
};

module.exports = {
  toggleContactVisibility,
  createEvent,
  getAllEvents,
  getEvent,
  manageTitles,
  createTitle,
  getMyEvents,
  notificatifyMe,
  getHorizontalEvents,
  getParticepent,
  deleteEvent,
  editEvent,
  getAttendedEvents,
  subscribeToEvent,
  getSubscribers,
  getNearEventController,
  getTeacherEvents,
  getUserProfile,
  getParticipants,
  skipClasses,
  resumeClasses,
  deleteTitle,
  getRecurringMeetings
};



