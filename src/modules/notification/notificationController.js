const { admin } = require('../../config/firebase-config');
const mongoose = require('mongoose'); // Add this line
const moment = require('moment-timezone'); // Add this line

const Notification = require("../../models/notification");
const Event = require("../../models/event");
const User = require("../../models/user");
const appError = require("../../common/utils/appError");
const httpStatus = require("../../common/utils/status.json");
const createResponse = require("../../common/utils/createResponse");
const { createNotification: createReminderNotifications } = require("./notificationService");

const createNotification = async (request, response) => {
  try {
    const { userId, eventId, title, description, type, scheduledTime } = request.body;
    const userTimezone = request.body.timezone || 'Asia/Kolkata'; // Default to IST if not specified

    //console.log('Creating notification:', {
    //   localTime: scheduledTime,
    //   timezone: userTimezone
    // });

    // Convert scheduledTime to UTC for storage
    const utcScheduledTime = scheduledTime ? 
      moment.tz(scheduledTime, userTimezone).utc().toDate() : 
      new Date();

    //console.log('Converted time:', {
      // original: scheduledTime,
    //   utc: utcScheduledTime.toISOString()
    // });

    const notification = await Notification.create({
      user: userId || request.user.id,
      event: eventId,
      title,
      description,
      type: type || 'event',
      scheduledTime: utcScheduledTime,
      status: 'pending',
      processed: false
    });

    createResponse(
      response,
      httpStatus.CREATED,
      "Notification created successfully",
      {
        ...notification.toJSON(),
        scheduledTimeLocal: moment(utcScheduledTime)
          .tz(userTimezone)
          .format('YYYY-MM-DD HH:mm:ss')
      }
    );
  } catch (error) {
    console.error('Notification Creation Error:', error);
    createResponse(
      response,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

const subscribeNotification = async (request, response) => {
  try {
    const { eventId } = request.params;
    const userId = request.user.id;
    const { fcmToken } = request.body; // Accept fcmToken from frontend

    // If fcmToken is provided, update it for the user
    if (fcmToken) {
      try {
        await require('../../modules/user/userService').updateFcmToken(userId, fcmToken);
      } catch (tokenErr) {
        console.error('Failed to update FCM token:', tokenErr);
        // Do not block subscription if token update fails
      }
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return createResponse(response, httpStatus.NOT_FOUND, "Event not found");
    }

    // Convert notifyTo to array of strings for frontend compatibility
    if (event.notifyTo && Array.isArray(event.notifyTo)) {
      event.notifyTo = event.notifyTo.map(id => id.toString());
    }

    // Check if user is already subscribed
    const isAlreadySubscribed = event.notifyTo?.includes(userId);
    
    if (isAlreadySubscribed) {
      // Unsubscribe logic
      await Event.findByIdAndUpdate(eventId, { 
        $pull: { notifyTo: userId } 
      });
      
      // Remove all related notifications
      await Notification.deleteMany({ 
        user: userId, 
        event: eventId 
      });
      
      // Return isSubscribed: false with isNotifyMe flag
      return createResponse(
        response, 
        httpStatus.OK, 
        "Unsubscribed successfully", 
        { 
          isSubscribed: false,
          isNotifyMe: false 
        }
      );
    }

    // Subscribe logic - only runs if user wasn't already subscribed
    await Event.findByIdAndUpdate(eventId, { 
      $addToSet: { notifyTo: userId } 
    });

    // Create immediate subscription notification
    await Notification.create({
      title: "Event Subscription",
      description: `You have subscribed to the event: ${event.title[0]}`,
      user: userId,
      event: eventId,
      type: "subscription",
      status: "pending",
      scheduledTime: new Date(),
      isOneHourReminder: false,
      processed: false
    });

    // Get event start time
    const eventStartTime = new Date(event.date.from);
    
    // Create reminder notifications
    const reminderTimes = [
      { minutes: 1440, message: "24 hours", isOneHourReminder: false },
      { minutes: 60, message: "one hour", isOneHourReminder: true },
      { minutes: 30, message: "30 minutes", isOneHourReminder: false },
      { minutes: 10, message: "10 minutes", isOneHourReminder: false }
    ];

    for (const reminder of reminderTimes) {
      const reminderTime = new Date(eventStartTime.getTime() - (reminder.minutes * 60 * 1000));
      
      // Only create future notifications
      if (reminderTime > new Date()) {
        await Notification.create({
          title: `Event Reminder: ${event.title[0]}`,
          description: `${event.title[0]} will start in ${reminder.message}`,
          user: userId,
          event: eventId,
          type: "reminder",
          status: "pending",
          scheduledTime: reminderTime,
          isOneHourReminder: reminder.isOneHourReminder,
          processed: false
        });
      }
    }

    // If it's a recurring event, handle future occurrences
    if (event.recurring) {
      const eventEndDate = new Date(event.date.to);
      let nextEventDate = new Date(eventStartTime);
      
      while (nextEventDate <= eventEndDate) {
        nextEventDate = new Date(nextEventDate.getTime() + (24 * 60 * 60 * 1000)); // Add 1 day
        
        for (const reminder of reminderTimes) {
          const reminderTime = new Date(nextEventDate.getTime() - (reminder.minutes * 60 * 1000));
          
          if (reminderTime > new Date()) {
            await Notification.create({
              title: `Event Reminder: ${event.title[0]}`,
              description: `${event.title[0]} will start in ${reminder.message}`,
              user: userId,
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

    // After subscription notification, also create reminder notifications
    try {
      await createReminderNotifications({
        body: {
          eventId: eventId,
          userId: userId,
          title: "Event Reminder",
          description: `You have subscribed to the event: ${event.title[0]}`
        }
      });
    } catch (reminderErr) {
      console.error('[ERROR] Failed to create reminder notifications after subscription:', reminderErr);
      // Do not block subscription if reminders fail
    }

    // Return isSubscribed: true with isNotifyMe flag
    return createResponse(
      response,
      httpStatus.OK,
      "Subscribed successfully",
      { 
        isSubscribed: true,
        isNotifyMe: true,
        notifyTo: event.notifyTo // Always send as array of strings
      }
    );

  } catch (error) {
    console.error('Subscription Error:', error);
    return createResponse(
      response,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Get user notifications for the notification panel/screen - Instagram Style
 * 
 * This function retrieves only:
 * 1. Subscription notifications (when user subscribes to an event)
 * 2. Reminder notifications that have been sent as push notifications (24hr, 1hr, 30min, 10min)
 * 
 * It ensures that the notification shows the event creator's profile image (not the app user's)
 * This matches the behavior of platforms like Instagram where notifications show who created content
 */
const getUserNotifications = async (request, response) => {
  try {
    // Get userId from route params if provided, otherwise use authenticated user
    const userId = request.params.id || request.user.id;

    console.log('[NOTIFICATION API] Getting notifications for user:', userId);

  // Fetch only subscription notifications and pushed reminder notifications (status='read')
    // Only show notifications that have been sent as push notifications (processed=true) 
    // or subscription notifications that the user has explicitly subscribed to
    const notifications = await Notification.find({ 
      user: userId,
      $or: [
        // Include subscription notifications
        { type: 'subscription' },
        // Include only reminder notifications that have been processed and read (sent as push)
        { 
          type: 'reminderNotification', 
          processed: true,
          status: 'read',
          $or: [
            { isOneHourReminder: true },                      // 1 hour reminders
            { description: { $regex: /24 hours/ } },          // 24 hour reminders
            { description: { $regex: /30 minutes/ } },        // 30 minute reminders
            { description: { $regex: /10 minutes/ } }         // 10 minute reminders
          ]
        }
      ],
      status: { $ne: 'archived' }
    })
    .populate({
      path: 'event', 
      select: 'title meetingLink date userId', // Include userId which points to event creator
      populate: {
        path: 'userId', // Event creator - CRITICAL for getting creator's profile image
        select: 'name userName profileImage email'
      }
    })
    .populate({
      path: 'user', // This is the app user (recipient of notification)
      select: 'name userName profileImage email'
    })
    .sort({ createdAt: -1 });
    
    // Debug log the population results
    console.log('[NOTIFICATION API] Population complete:', {
      totalNotifications: notifications.length,
      firstNotification: notifications.length > 0 ? {
        id: notifications[0]._id,
        hasEventCreator: !!notifications[0].event?.userId,
        eventCreatorId: notifications[0].event?.userId?._id,
        eventCreatorName: notifications[0].event?.userId?.name,
        hasEventCreatorImage: !!notifications[0].event?.userId?.profileImage
      } : 'none'
    });

    console.log('[NOTIFICATION API] Total Notifications Found:', notifications.length);

    // Format notifications for Flutter with profile images
    const formattedNotifications = notifications.map(notification => {
      console.log('[NOTIFICATION API] Processing notification:', {
        id: notification._id,
        hasEvent: !!notification.event,
        hasEventCreator: !!(notification.event && notification.event.userId),
        eventCreatorName: notification.event?.userId?.name,
        eventCreatorProfileImage: notification.event?.userId?.profileImage,
        currentUserName: notification.user?.name,
        currentUserProfileImage: notification.user?.profileImage
      });

      // For all notification types, ALWAYS prioritize event creator's profile image
      // Do NOT use the current user's profile image
      let profileUser = null;
      let profileSource = 'none';
      
      // Debug logging to help diagnose the issue
      console.log('[NOTIFICATION API] Event data:', {
        hasEvent: !!notification.event,
        eventUserId: notification.event?.userId?._id,
        eventCreatorName: notification.event?.userId?.name,
        eventCreatorImg: notification.event?.userId?.profileImage
      });
      
      if (notification.event && notification.event.userId) {
        profileUser = notification.event.userId; // Event creator
        profileSource = 'event_creator';
      }
      // Do not fallback to notification.user as that's the current app user

      // Create a formatted notification object that ensures the event creator's image is used
      const formatted = {
        _id: notification._id,
        title: notification.title,
        description: notification.description,
        type: notification.type || 'subscription',
        status: notification.status || 'pending',
        // Include complete event data with creator information
        event: notification.event ? {
          _id: notification.event._id,
          meetingLink: notification.event.meetingLink,
          title: notification.event.title,
          date: notification.event.date,
          // Include creator data in a separate property for the client
          creator: notification.event.userId ? {
            _id: notification.event.userId._id,
            name: notification.event.userId.name,
            userName: notification.event.userId.userName,
            profileImage: notification.event.userId.profileImage,
            email: notification.event.userId.email
          } : null
        } : null,
        // Important: Use the event creator's data in the user field for profile display
        // This is what the client app uses to display the profile image
        user: notification.event?.userId ? {
          _id: notification.event.userId._id,
          name: notification.event.userId.name,
          userName: notification.event.userId.userName,
          profileImage: notification.event.userId.profileImage,
          email: notification.event.userId.email
        } : null,
        // Add timestamp for sorting
        createdAt: notification.createdAt,
        // Add the processed state so we know if it's been sent as a push notification
        processed: notification.processed
      };

      console.log('[NOTIFICATION API] Formatted notification:', {
        id: formatted._id,
        profileSource: profileSource,
        hasUser: !!formatted.user,
        profileImage: formatted.user?.profileImage,
        userName: formatted.user?.name,
        eventCreator: formatted.event?.creator?.name,
        eventCreatorImage: formatted.event?.creator?.profileImage
      });

      return formatted;
    });

    createResponse(
      response, 
      httpStatus.OK, 
      "Notifications retrieved successfully", 
      formattedNotifications
    );
  } catch (error) {
    console.error('Notification Retrieval Error:', error);
    createResponse(
      response, 
      error.status || httpStatus.INTERNAL_SERVER_ERROR, 
      error.message
    );
  }
};

// Scheduler function to send reminders
const sendEventReminders = async () => {
  const now = new Date();
  console.log(`[DEBUG] Running sendEventReminders at ${now.toISOString()}`);
  const notifications = await Notification.find({
    type: 'reminderNotification',
    status: 'pending',
    processed: false,
    scheduledTime: { $lte: now },
  }).populate('user').populate('event');

  console.log(`[DEBUG] Found ${notifications.length} reminders to send`);

  for (const notification of notifications) {
    try {
      // Skip if event is skipped for this date or notification is not pending
      if (!notification.user || !notification.user.fcmToken) {
        console.warn(`[WARN] No FCM token for user ${notification.user ? notification.user._id : 'UNKNOWN'} in notification ${notification._id}`);
        continue;
      }
      if (notification.event && notification.event.skippedDates) {
        const notifDate = notification.scheduledTime.toISOString().split('T')[0];
        if (notification.event.skippedDates.includes(notifDate) || notification.status !== 'pending') {
          console.log(`[DEBUG] Skipping notification ${notification._id} for skipped/resumed date or not pending`);
          continue;
        }
      }
      console.log(`[DEBUG] Sending reminder notification ${notification._id} to user ${notification.user._id} (FCM token starts with: ${notification.user.fcmToken ? notification.user.fcmToken.substring(0, 10) : 'N/A'})`);
      await sendPushNotification({
        userId: notification.user._id,
        title: notification.title,
        body: notification.description,
        data: {}
      });
      notification.status = "read";
      notification.processed = true;
      await notification.save();
      console.log(`[DEBUG] Sent and marked as read: notification ${notification._id}`);
    } catch (err) {
      console.error(`[ERROR] Failed to send notification ${notification._id}:`, err);
    }
  }
};
const getNotificationById = async (request, response) => {
  try {
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new appError(httpStatus.BAD_REQUEST, "Invalid notification ID");
    }

    //console.log('Debug - Getting notification by ID:', { notificationId: id });

    const notification = await Notification.findById(id)
      .populate('event')
      .populate('user');

    if (!notification) {
      throw new appError(httpStatus.NOT_FOUND, "Notification not found");
    }

    //console.log('Debug - Found notification:', {
    //   notificationId: id,
    //   scheduledAt: notification.scheduledAt,
    // });

    createResponse(
      response,
      httpStatus.OK,
      "Notification retrieved successfully",
      notification
    );
  } catch (error) {
    console.error('Error in getNotificationById:', error);
    createResponse(response, error.status || httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

const disableNotification = async (request, response) => {
  const { eventId } = request.params;
  const { date } = request.body;
  const userId = request.user.id;

  const event = await Event.findById(eventId);
  if (!event || !event.notifyTo.includes(userId)) {
    return createResponse(response, httpStatus.NOT_FOUND, 'Event not found or user not subscribed');
  }

  const exceptionKey = new Date(date).toISOString().split('T')[0];
  await Event.findByIdAndUpdate(eventId, { $addToSet: { notificationExceptions: exceptionKey } });
  return createResponse(response, httpStatus.OK, `Notifications disabled for ${exceptionKey}`);
};

const enableNotification = async (request, response) => {
  const { eventId } = request.params;
  const { date } = request.body;
  const userId = request.user.id;

  const event = await Event.findById(eventId);
  if (!event || !event.notifyTo.includes(userId)) {
    return createResponse(response, httpStatus.NOT_FOUND, 'Event not found or user not subscribed');
  }

  const exceptionKey = new Date(date).toISOString().split('T')[0];
  await Event.findByIdAndUpdate(eventId, { $pull: { notificationExceptions: exceptionKey } });
  return createResponse(response, httpStatus.OK, `Notifications enabled for ${exceptionKey}`);
};

/**
 * Send a push notification to a user
 * 
 * This function sends a Firebase Cloud Messaging (FCM) push notification
 * AND creates/updates an entry in the Notification collection so it appears
 * in the in-app notification panel - Instagram style.
 * 
 * @param {Object} options - Notification options
 * @param {string} options.userId - User ID to send the notification to
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body/message
 * @param {Object} options.data - Additional data for the notification
 * @param {string} [options.eventId] - Associated event ID (if applicable)
 * @param {string} [options.type='system'] - Notification type
 */
const sendPushNotification = async ({ userId, title, body, data, eventId, type = 'system' }) => {
  console.log('[PUSH NOTIFICATION] Sending push notification:', {
    userId,
    title,
    body: body.substring(0, 30) + (body.length > 30 ? '...' : ''),
    eventId: eventId || 'none',
    type
  });
  
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log('[PUSH NOTIFICATION] Invalid user ID:', userId);
      return;
    }

    if (!title || !body) {
      console.log('[PUSH NOTIFICATION] Missing title or body');
      return;
    }

    const user = await User.findById(userId);
    console.log('[PUSH NOTIFICATION] Found user:', {
      userId,
      hasFcmToken: !!user?.fcmToken,
      name: user?.name
    });

    if (!user) {
      console.log('[PUSH NOTIFICATION] User not found:', userId);
      return;
    }

    // STEP 1: Create or update a notification entry in the database
    // This ensures the notification shows up in the in-app notification panel
    try {
      // Create a notification document that will show in the notification panel
      const notificationDoc = {
        title,
        description: body,
        user: userId,
        event: eventId, // If eventId is provided, link to the event
        type: type || 'system',
        status: 'read', // Mark as read since we're sending it now
        scheduledTime: new Date(),
        processed: true, // Mark as processed since we're sending it now
      };
      
      // If this is a reminder notification with specific timing, set appropriate flag
      if (body.includes('1 hour') || body.includes('one hour')) {
        notificationDoc.isOneHourReminder = true;
      }
      
      // Create the notification entry
      const notification = await Notification.create(notificationDoc);
      console.log('[PUSH NOTIFICATION] Created in-app notification:', notification._id);
      
      // If eventId is provided, populate the event info for better display
      if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
        await notification.populate({
          path: 'event',
          select: 'title meetingLink date userId',
          populate: {
            path: 'userId', // Populate event creator for profile image
            select: 'name userName profileImage email'
          }
        });
        await notification.save();
      }
    } catch (notifErr) {
      console.error('[PUSH NOTIFICATION] Failed to create in-app notification:', notifErr);
      // Continue with push notification even if in-app notification fails
    }
    
    // STEP 2: Only proceed with FCM if user has a token
    if (!user.fcmToken) {
      console.log('[PUSH NOTIFICATION] No FCM token for user:', userId);
      return;
    }

    // Construct FCM message
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        eventId: eventId || '',
        type: type || 'system'
      },
      token: user.fcmToken,
      android: {
        priority: 'high',
        notification: {
          channelId: 'event_reminders',
          sound: 'default'
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    };

    console.log('[PUSH NOTIFICATION] Sending FCM message');
    const response = await admin.messaging().send(message);
    console.log('[PUSH NOTIFICATION] FCM notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('FCM notification failed:', {
      userId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

const toggleEventSkip = async (request, response) => {
  try {
    const { eventId } = request.params;
    const userId = request.user.id;
    // Find the event first to check current state
    const event = await Event.findById(eventId);
    if (!event) {
      return createResponse(response, httpStatus.NOT_FOUND, "Event not found");
    }
    // Ensure user has permission
    const isAuthorized =
      event.userId.toString() === userId ||
      (event.teachers && event.teachers.some(teacherId => teacherId.toString() === userId));
    if (!isAuthorized) {
      return createResponse(
        response,
        httpStatus.FORBIDDEN,
        "Not authorized to modify this event"
      );
    }
    // Helper to format date as YYYY-MM-DD
    const formatDate = d => new Date(d).toISOString().split('T')[0];
    // Generate all upcoming dates
    const today = formatDate(new Date());
    let allUpcomingDates = [];
    if (event.recurring) {
      // Recurring event logic
      const startDate = event.date && event.date.from ? new Date(event.date.from) : new Date();
      let untilDate = event.date && event.date.to ? new Date(event.date.to) : null;
      if (event.recurringPattern && event.recurringPattern.until) {
        untilDate = new Date(event.recurringPattern.until);
      }
      const freq = event.recurringPattern && event.recurringPattern.frequency ? event.recurringPattern.frequency : 'DAILY';
      const interval = event.recurringPattern && event.recurringPattern.interval ? event.recurringPattern.interval : 1;
      let current = new Date(Math.max(startDate, new Date()));
      untilDate = untilDate || new Date(current.getFullYear() + 5, 0, 1); // fallback: 5 years max
      while (current <= untilDate) {
        const dStr = formatDate(current);
        if (dStr >= today) allUpcomingDates.push(dStr);
        // increment
        if (freq === 'DAILY') current.setDate(current.getDate() + interval);
        else if (freq === 'WEEKLY') current.setDate(current.getDate() + 7 * interval);
        else if (freq === 'MONTHLY') current.setMonth(current.getMonth() + interval);
        else if (freq === 'YEARLY') current.setFullYear(current.getFullYear() + interval);
        else current.setDate(current.getDate() + 1); // fallback daily
      }
    } else {
      // Non-recurring: use date.from to date.to if both exist, otherwise just from
      const from = event.date && event.date.from ? new Date(event.date.from) : null;
      const to = event.date && event.date.to ? new Date(event.date.to) : null;
      if (from && to) {
        let current = new Date(Math.max(from, new Date()));
        while (current <= to) {
          const dStr = formatDate(current);
          if (dStr >= today) allUpcomingDates.push(dStr);
          current.setDate(current.getDate() + 1);
        }
      } else if (from) {
        const dStr = formatDate(from);
        if (dStr >= today) allUpcomingDates.push(dStr);
      }
    }
    // Check if all upcoming dates are already skipped
    const allSkipped = allUpcomingDates.length > 0 && allUpcomingDates.every(date => event.skippedDates.includes(date));
    let updatedEvent;
    if (allSkipped) {
      // Resume: remove all upcoming dates from skippedDates
      updatedEvent = await Event.findByIdAndUpdate(
        eventId,
        { $pull: { skippedDates: { $in: allUpcomingDates } } },
        { new: true }
      );
      // Also resume notifications for those dates
      await Notification.updateMany({
        event: eventId,
        type: 'reminderNotification',
        status: 'pause',
        scheduledTime: { $gte: new Date() },
        $expr: { $in: [{ $dateToString: { format: "%Y-%m-%d", date: "$scheduledTime" } }, allUpcomingDates] }
      }, {
        $set: { status: 'pending' }
      });
    } else {
      // Pause: add all upcoming dates to skippedDates
      updatedEvent = await Event.findByIdAndUpdate(
        eventId,
        { $addToSet: { skippedDates: { $each: allUpcomingDates } } },
        { new: true }
      );
      // Also pause notifications for those dates
      await Notification.updateMany({
        event: eventId,
        type: 'reminderNotification',
        status: 'pending',
        scheduledTime: { $gte: new Date() },
        $expr: { $in: [{ $dateToString: { format: "%Y-%m-%d", date: "$scheduledTime" } }, allUpcomingDates] }
      }, {
        $set: { status: 'pause' }
      });
    }
    return createResponse(
      response,
      httpStatus.OK,
      allSkipped ? "Event resumed for all upcoming dates" : "Event paused for all upcoming dates",
      {
        isSkipped: !allSkipped,
        dates: allUpcomingDates,
        skippedDates: updatedEvent.skippedDates // Include in response for verification
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

// Add new function to check notification status for an event
const checkNotificationStatus = async (request, response) => {
  try {
    const { eventId } = request.params;
    const userId = request.user.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return createResponse(response, httpStatus.BAD_REQUEST, "Invalid event ID");
    }

    //console.log('Debug - Checking notification status:', { eventId, userId });

    const event = await Event.findById(eventId);
    if (!event) {
      return createResponse(response, httpStatus.NOT_FOUND, "Event not found");
    }

    // Convert notifyTo to array of strings
    let notifyTo = Array.isArray(event.notifyTo) ? event.notifyTo.map(id => id.toString()) : [];
    const isSubscribed = notifyTo.includes(userId.toString());

    //console.log('Debug - Notification status check result:', { 
    //   eventId, 
    //   userId, 
    //   isSubscribed,
    //   notifyToCount: event.notifyTo?.length || 0
    // });

    // Return consistent response with isSubscribed and isNotifyMe flags
    return createResponse(
      response,
      httpStatus.OK,
      isSubscribed ? "User is subscribed to this event" : "User is not subscribed to this event",
      {
        isSubscribed,
        isNotifyMe: isSubscribed,
        eventId,
        notifyTo // Always send as array of strings
      }
    );
  } catch (error) {
    console.error('Error checking notification status:', error);
    return createResponse(
      response,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

module.exports = {
  sendPushNotification,
  createNotification,
  subscribeNotification,
  getUserNotifications,
  sendEventReminders,
  getNotificationById,
  disableNotification,
  enableNotification,
  toggleEventSkip,
  checkNotificationStatus
};
