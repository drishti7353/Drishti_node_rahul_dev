const schedule = require('node-schedule');
const Notification = require("../../models/notification");
const Event = require("../../models/event");
const appError = require("../../common/utils/appError");
const httpStatus = require("../../common/utils/status.json");
const User = require('../../models/user')


async function createNotification(request) {
    console.log('[DEBUG] createNotification called. Incoming request:', JSON.stringify(request, null, 2));
    // Defensive: handle both direct and .body usage
    const body = request.body ? request.body : request;
    const { title, description, eventId, userId } = body;
    console.log('[DEBUG] Extracted fields:', { title, description, eventId, userId });

    if (!eventId || !userId) {
        console.error('[ERROR] Missing eventId or userId');
        throw new appError(httpStatus.BAD_REQUEST, "Missing eventId or userId");
    }

    const event = await Event.findById(eventId);
    const user = await User.findById(userId);

    if (!event || !user) {
        console.error('[ERROR] Event or User not found', { event, user });
        throw new appError(httpStatus.NOT_FOUND, "Event or User not found");
    }
    console.log('[DEBUG] Found event:', event ? event._id : null, 'Found user:', user ? user._id : null);

    // Use event.timeOffset (e.g., 'UTC+05:30') and event.duration[0].from (e.g., '02:30AM') to compute session start in UTC
    const moment = require('moment-timezone');
    let eventTimeZone = 'UTC';
    if (event.timeOffset && event.timeOffset.startsWith('UTC')) {
        eventTimeZone = event.timeOffset.replace('UTC', 'Etc/GMT').replace('+', '-').replace(':', '');
        if (event.timeOffset === 'UTC+05:30') eventTimeZone = 'Asia/Kolkata';
    }
    const durationFrom = event.duration && event.duration[0] && event.duration[0].from ? event.duration[0].from : '06:00AM';
    const eventDate = event.date && event.date.from ? event.date.from : null;
    if (!eventDate) {
        console.error('[ERROR] Event date is missing');
        throw new appError(httpStatus.BAD_REQUEST, "Event date is missing");
    }
    const sessionStartLocal = moment.tz(
        `${moment.utc(eventDate).format('YYYY-MM-DD')} ${durationFrom}`,
        'YYYY-MM-DD hh:mma',
        eventTimeZone
    );
    const reminderOffsets = [
        { minutes: 1440, isOneHourReminder: false }, // 24 hours
        { minutes: 60, isOneHourReminder: true },    // 1 hour
        { minutes: 30, isOneHourReminder: false },   // 30 minutes
        { minutes: 10, isOneHourReminder: false }    // 10 minutes
    ];
    const notifications = [];
    for (const reminder of reminderOffsets) {
        const scheduledTime = sessionStartLocal.clone().subtract(reminder.minutes, 'minutes').utc().toDate();
        let timeMsg = '';
        if (reminder.minutes === 60) timeMsg = '1 hour';
        else if (reminder.minutes === 30) timeMsg = '30 minutes';
        else if (reminder.minutes === 10) timeMsg = '10 minutes';
        // Deduplication: only create if not already present
        const exists = await Notification.findOne({
            user: user._id,
            event: event._id,
            scheduledTime: scheduledTime,
            type: "reminderNotification"
        });
        if (!exists) {
            notifications.push({
                title: "Event Reminder",
                description: `Your event "${event.title[0]}" will start in ${timeMsg}.`,
                user: user._id,
                event: event._id,
                status: "pending",
                type: "reminderNotification",
                scheduledTime: scheduledTime,
                userTimezone: eventTimeZone,
                isOneHourReminder: reminder.isOneHourReminder,
                failedAttempts: 0,
                processed: false,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        } else {
            console.log(`[DEBUG] Skipping duplicate notification for user ${user._id}, event ${event._id}, scheduledTime ${scheduledTime}`);
        }
    }
    console.log('[DEBUG] Will attempt to insert notifications:', notifications);

    try {
        if (notifications.length > 0) {
            const result = await Notification.insertMany(notifications);
            console.log('[DEBUG] Successfully inserted reminder notifications:', result.map(n => n._id));
        } else {
            console.log('[DEBUG] No new notifications to insert (all were duplicates)');
        }
    } catch (err) {
        console.error('[ERROR] Failed to insert reminder notifications:', err);
        throw new appError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to insert reminder notifications');
    }

    return {
        message: "Reminder notifications scheduled successfully",
        scheduledTimes: notifications.map(n => n.scheduledTime),
        notificationCount: notifications.length
    };
}

async function getNotifications() {
    return await Notification.find().sort({ date: -1 })
}

async function getNotificationById(request) {
    const { id } = request.params;
    const notification = await Notification.findById(id);
    if (!notification) {
        throw new appError(httpStatus.NOT_FOUND, "Notification not found");
    }
    
    return notification;
}



module.exports = {
    createNotification,
    getNotifications,
    getNotificationById,
    // updateEventById
};