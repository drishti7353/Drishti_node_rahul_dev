const admin = require('firebase-admin');
const serviceAccount = require('../src/modules/notification/serviceAccountKey.json');
const mongoose = require('mongoose');

const Notification = require("../src/models/notification");
const Event = require("../src/models/event");
const User = require("../src/models/user");
const appError = require("../src/common/utils/appError");
const httpStatus = require("../src/common/utils/status.json");
const createResponse = require("../src/common/utils/createResponse");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const sendPushNotification = async ({ userId, title, body, data }) => {
  //console.log('[FCM] Starting push notification send:', {
    userId,
    title,
    dataKeys: Object.keys(data || {})
  });

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('[FCM] Invalid user ID format:', userId);
      throw new Error('Invalid user ID');
    }

    const user = await User.findById(userId);
    //console.log('[FCM] User lookup result:', {
      userId,
      found: !!user,
      hasFcmToken: !!user?.fcmToken
    });

    if (!user || !user.fcmToken) {
      throw new Error(`User not found or FCM token missing for user ${userId}`);
    }

    const message = {
      notification: { title, body },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      token: user.fcmToken,
      android: {
        priority: 'high',
        notification: {
          channelId: 'event_reminders',
          sound: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default'
          }
        }
      }
    };

    //console.log('[FCM] Prepared message:', {
      title,
      body: body.substring(0, 50) + (body.length > 50 ? '...' : ''),
      token: `${user.fcmToken.substring(0, 10)}...`,
      dataKeys: Object.keys(message.data)
    });

    const response = await admin.messaging().send(message);
    //console.log('[FCM] Successfully sent message:', {
      messageId: response,
      userId,
      title
    });

    return response;
  } catch (error) {
    console.error('[FCM] Push notification failed:', {
      userId,
      error: error.message,
      errorCode: error.code,
      stack: error.stack
    });
    throw error;
  }
};

const createNotification = async (req, res) => {
  try {
    const { eventId, userId, title, description, type } = req.body;

    const notification = await Notification.create({
      event: eventId,
      user: userId,
      title,
      description,
      type: type || 'event'
    });

    createResponse(
      res,
      httpStatus.CREATED,
      "Notification created successfully",
      notification
    );
  } catch (error) {
    createResponse(res, error.status || httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

const sendEventReminders = async () => {
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const upcomingEvents = await Event.find({
      'date.from': {
        $gte: now,
        $lte: oneHourFromNow
      }
    }).populate('notifyTo');

    for (const event of upcomingEvents) {
      for (const user of event.notifyTo) {
        const notification = await Notification.create({
          title: `Event Reminder: ${event.title}`,
          description: `Your event "${event.title}" starts in 1 hour`,
          user: user._id,
          event: event._id,
          type: 'reminder',
          scheduledTime: now
        });

        try {
          await sendPushNotification({
            userId: user._id,
            title: notification.title,
            body: notification.description,
            data: { eventId: event._id.toString() }
          });
        } catch (error) {
          console.error('Failed to send push notification:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error in sendEventReminders:', error);
  }
};

const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .populate('event')
      .sort({ createdAt: -1 });

    createResponse(
      res,
      httpStatus.OK,
      "Notifications retrieved successfully",
      notifications
    );
  } catch (error) {
    createResponse(res, error.status || httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

module.exports = {
  sendPushNotification,
  createNotification,
  sendEventReminders,
  getUserNotifications
};
