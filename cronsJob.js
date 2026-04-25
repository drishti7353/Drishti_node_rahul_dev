const cron = require('node-cron');
const Event = require('../../models/event');
const User = require('../../models/user');
const { sendPushNotification } = require('./notificationController');

cron.schedule('* * * * *', async () => {
  //console.log('Running notification check...');
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const fiveMinutesBefore = new Date(oneHourFromNow.getTime() - 5 * 60 * 1000);

  // Find events starting in one hour
  const events = await Event.find({
    $or: [
      // Non-recurring events
      {
        recurring: false,
        'date.from': { $gte: fiveMinutesBefore, $lte: oneHourFromNow },
      },
      // Recurring events (assuming daily for simplicity)
      {
        recurring: true,
        'date.from': { $lte: oneHourFromNow },
        'date.to': { $gte: fiveMinutesBefore },
      },
    ],
    notifyTo: { $exists: true, $ne: [] },
  }).populate('notifyTo');

  for (const event of events) {
    const eventStart = new Date(event.date.from);
    let nextOccurrence = eventStart;

    if (event.recurring) {
      // For daily recurring events, calculate the next occurrence
      while (nextOccurrence <= now) {
        nextOccurrence = new Date(nextOccurrence.getTime() + 24 * 60 * 60 * 1000);
      }
      if (nextOccurrence > event.date.to) continue; // Beyond recurrence period
    }

    const notificationTime = new Date(nextOccurrence.getTime() - 60 * 60 * 1000);
    if (notificationTime < fiveMinutesBefore || notificationTime > oneHourFromNow) continue;

    // Check for exceptions (stored in a new field `notificationExceptions`)
    const exceptionKey = nextOccurrence.toISOString().split('T')[0];
    if (event.notificationExceptions?.includes(exceptionKey)) continue;

    const title = `Event Reminder: ${event.title[0]}`;
    const body = `${event.title[0]} starts in one hour${event.meetingLink ? ` at ${event.meetingLink}` : ''}`;

    for (const user of event.notifyTo) {
      if (user.fcmToken) {
        await sendPushNotification(user.fcmToken, title, body, { eventId: event._id.toString() });
      }
    }
  }
});
