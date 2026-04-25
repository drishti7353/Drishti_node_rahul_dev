const cron = require("node-cron");
const moment = require("moment-timezone");
const Notification = require("../../models/notification");
const { messaging } = require("../../config/firebase-config");

const TIMEZONE = 'Asia/Kolkata';
const MAX_RETRY_ATTEMPTS = 3;

function logTimeInfo(label, time) {
  // //console.log(`[TIME-DEBUG] ${label}:`, {
  //   originalTime: time.format(),
  //   utc: time.utc().format(),
  //   unix: time.unix(),
  // });
}

const processNotifications = async () => {
  const now = moment().tz(TIMEZONE);
  logTimeInfo('Current Time', now);

  // Convert to UTC for database query
  const utcNow = now.clone().utc();
  const utcFiveMinutesFromNow = now.clone().add(5, 'minutes').utc();

  logTimeInfo('UTC Query Window Start', utcNow);
  logTimeInfo('UTC Query Window End', utcFiveMinutesFromNow);

  try {
    const notifications = await Notification.find({
      scheduledTime: {
        $gte: utcNow.toDate(),
        $lte: utcFiveMinutesFromNow.toDate()
      },
      status: "pending",
      processed: false
    }).populate('user event');

    //console.log(`Found ${notifications.length} notifications to process`);

    for (const notification of notifications) {
      try {
        // Verify user and FCM token
        if (!notification.user?.fcmToken) {
          //console.log(`No FCM token for notification ${notification._id}`);
          await Notification.findByIdAndUpdate(notification._id, { 
            processed: true,
            status: "failed",
            failureReason: "No FCM token available"
          });
          continue;
        }

        // Mark as processed before sending to prevent duplicate sends
        await Notification.findByIdAndUpdate(notification._id, { 
          processed: true,
          processingStarted: new Date()
        });

        // Prepare and send FCM message
        const message = {
          notification: {
            title: notification.title,
            body: notification.description
          },
          token: notification.user.fcmToken,
          data: {
            eventId: notification.event?._id.toString(),
            type: notification.type,
            scheduledTime: notification.scheduledTime.toISOString(),
            click_action: 'FLUTTER_NOTIFICATION_CLICK'
          },
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

        await messaging.send(message);
        
        await Notification.findByIdAndUpdate(notification._id, {
          status: "completed",
          completedAt: new Date()
        });

        //console.log(`Successfully sent notification ${notification._id}`);

      } catch (error) {
        console.error(`Error processing notification ${notification._id}:`, error);
        
        const attempts = (notification.failedAttempts || 0) + 1;
        await Notification.findByIdAndUpdate(notification._id, {
          failedAttempts: attempts,
          status: attempts >= MAX_RETRY_ATTEMPTS ? "failed" : "pending",
          processed: attempts >= MAX_RETRY_ATTEMPTS,
          failureReason: error.message,
          lastError: {
            message: error.message,
            time: new Date()
          }
        });
      }
    }
  } catch (error) {
    console.error('[CRON] Job execution failed:', error);
  }
};

module.exports = () => {
  //console.log(`Initializing notification cron job (Timezone: ${TIMEZONE})`);
  
  // Run every minute
  cron.schedule("* * * * *", processNotifications, {
    timezone: TIMEZONE
  });

  // Also export the processor for manual testing
  return { processNotifications };
};