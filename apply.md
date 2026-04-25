To address your query, I'll provide a complete solution for implementing a Firebase Cloud Messaging (FCM) notification system for events based on the notifyTo list in your Event schema. The system will send push notifications one hour before the event's date.from time to all users in the notifyTo list, handle both recurring and non-recurring events, and include functionality to disable/enable notifications with specific occurrence exceptions (e.g., pausing notifications for a specific day in a recurring event). Below, I'll outline the flow and provide the necessary code modifications for both the backend (Node.js) and frontend (Flutter), leveraging the provided code snippets.
Overview of the Solution
Requirements
Push Notifications via FCM: Send notifications to users in the notifyTo list one hour before date.from using FCM.
Recurring and Non-Recurring Events: Handle both types of events, calculating the next occurrence for recurring events.
Notify Me Button: When pressed in HomeListViewItem, subscribe/unsubscribe the user and schedule notifications.
Notification Display: Show notifications on the NotificationScreen.
Disable/Enable Notifications: Allow pausing notifications for specific occurrences (e.g., skip tomorrow's notification for a daily recurring event), resuming from the next occurrence after re-enabling.
Example Data: Use the provided MongoDB event data (non-recurring event starting "2025-02-28T18:30:00.000Z") as a reference.
Key Components
Backend:
Modify the subscribeNotification controller to schedule FCM notifications.
Implement a cron job to send notifications one hour before date.from.
Add logic for recurring events and notification exceptions.
Add API endpoints for disabling/enabling notifications with occurrence-specific control.
Frontend:
Update HomeListViewItem to toggle notifications and reflect the status.
Ensure NotificationScreen displays scheduled notifications.
Integrate FCM in Flutter to receive and display push notifications.
Backend Implementation

1. Prerequisites
   FCM Setup: Ensure Firebase Admin SDK is initialized with serviceAccountKey.json (already provided).
   User Schema: Assume each User document has an fcmToken field to store the FCM token.
   Event Schema: Use the provided eventSchema with notifyTo and recurring fields.
2. Modify notificationController.js
   Update the subscribeNotification function to handle subscription and schedule notifications:
   javascript
   const admin = require('firebase-admin');
   const Event = require('../../models/event');
   const User = require('../../models/user');
   const Notification = require('../../models/notification');
   const httpStatus = require('../../common/utils/status.json');
   const createResponse = require('../../common/utils/createResponse');

const subscribeNotification = async (request, response) => {
try {
const { eventId } = request.params;
const userId = request.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return createResponse(response, httpStatus.NOT_FOUND, 'Event not found');
    }

    const isSubscribed = event.notifyTo.includes(userId);

    if (isSubscribed) {
      // Unsubscribe
      await Event.findByIdAndUpdate(eventId, { $pull: { notifyTo: userId } });
      await Notification.deleteMany({ user: userId, event: eventId });
      return createResponse(response, httpStatus.OK, 'Unsubscribed successfully', { isSubscribed: false });
    } else {
      // Subscribe
      await Event.findByIdAndUpdate(eventId, { $addToSet: { notifyTo: userId } });

      // Create subscription notification
      await Notification.create({
        user: userId,
        event: eventId,
        title: `Subscribed to ${event.title[0]}`,
        description: `You will be notified about "${event.title[0]}"`,
        type: 'subscription',
        status: 'sent',
      });

      return createResponse(response, httpStatus.OK, 'Subscribed successfully', { isSubscribed: true });
    }

} catch (error) {
console.error('Subscription Error:', error);
createResponse(response, httpStatus.INTERNAL_SERVER_ERROR, 'Failed to process subscription', { error: error.message });
}
};

// Send FCM push notification
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
const message = {
notification: { title, body },
data,
token: fcmToken,
android: { priority: 'high' },
};

try {
await admin.messaging().send(message);
//console.log(`Notification sent to token: ${fcmToken}`);
} catch (error) {
console.error('Error sending FCM notification:', error);
}
};

module.exports = { subscribeNotification, sendPushNotification }; 3. Implement Notification Scheduling in cronsJob.js
Create a cron job to check for upcoming events and send notifications one hour before date.from. Handle recurring events and exceptions:
javascript
const cron = require('node-cron');
const Event = require('../../models/event');
const User = require('../../models/user');
const { sendPushNotification } = require('./notificationController');

cron.schedule('\* \* \* \* _', async () => {
//console.log('Running notification check...');
const now = new Date();
const oneHourFromNow = new Date(now.getTime() + 60 _ 60 _ 1000);
const fiveMinutesBefore = new Date(oneHourFromNow.getTime() - 5 _ 60 \* 1000);

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
Note: Add a notificationExceptions field to the eventSchema to track disabled notification dates:
javascript
notificationExceptions: [{ type: String }], // Stores dates like "2025-03-01" 4. Add Disable/Enable Notification API
Add endpoints to notificationController.js and notificationRoute.js:
javascript
// In notificationController.js
const disableNotification = async (request, response) => {
const { eventId } = request.params;
const { date } = request.body; // Date to disable (e.g., "2025-03-01")
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
const { date } = request.body; // Date to re-enable
const userId = request.user.id;

const event = await Event.findById(eventId);
if (!event || !event.notifyTo.includes(userId)) {
return createResponse(response, httpStatus.NOT_FOUND, 'Event not found or user not subscribed');
}

const exceptionKey = new Date(date).toISOString().split('T')[0];
await Event.findByIdAndUpdate(eventId, { $pull: { notificationExceptions: exceptionKey } });
return createResponse(response, httpStatus.OK, `Notifications enabled for ${exceptionKey}`);
};

module.exports = { subscribeNotification, sendPushNotification, disableNotification, enableNotification };

// In notificationRoute.js
router.route('/disable/:eventId')
.post(auth(ROLES.USER), notificationController.disableNotification)
.all(methodNotAllowed);

router.route('/enable/:eventId')
.post(auth(ROLES.USER), notificationController.enableNotification)
.all(methodNotAllowed);
Frontend Implementation

1. Update HomeListViewItem in Flutter
   Modify \_handleNotificationToggle to call the subscription API and add disable/enable buttons:
   dart
   class \_HomeListViewItemState extends State<HomeListViewItem> {
   final NotificationService notificationService = NotificationService();
   bool \_isLoading = false;
   late ValueNotifier<bool> \_isNotified;

@override
void initState() {
super.initState();
\_isNotified = ValueNotifier(widget.event?.notifyTo?.contains(widget.userID) ?? false);
}

Future<void> \_handleNotificationToggle() async {
if (\_isLoading || widget.event?.id == null) return;

    setState(() => _isLoading = true);

    try {
      final result = await notificationService.toggleNotification(widget.event!.id!);
      if (result['success']) {
        setState(() {
          if (result['isSubscribed']) {
            widget.event?.notifyTo?.add(widget.userID);
          } else {
            widget.event?.notifyTo?.remove(widget.userID);
          }
          _isNotified.value = result['isSubscribed'];
        });
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result['message'])));
      } else {
        throw Exception(result['message']);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
    } finally {
      setState(() => _isLoading = false);
    }

}

Future<void> \_disableNotification(DateTime date) async {
try {
final token = await SharedPreferencesHelper.getAccessToken();
final response = await http.post(
Uri.parse('http://192.168.0.101:3000/notifications/disable/${widget.event!.id}'),
headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
body: jsonEncode({'date': date.toIso8601String()}),
);
if (response.statusCode == 200) {
ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Notification disabled for ${date.toString().split(' ')[0]}')));
} else {
throw Exception('Failed to disable notification');
}
} catch (e) {
ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
}
}

Future<void> \_enableNotification(DateTime date) async {
try {
final token = await SharedPreferencesHelper.getAccessToken();
final response = await http.post(
Uri.parse('http://192.168.0.101:3000/notifications/enable/${widget.event!.id}'),
headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
body: jsonEncode({'date': date.toIso8601String()}),
);
if (response.statusCode == 200) {
ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Notification enabled for ${date.toString().split(' ')[0]}')));
} else {
throw Exception('Failed to enable notification');
}
} catch (e) {
ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
}
}

Widget _notifyButton() {
return Row(
children: [
ValueListenableBuilder<bool>(
valueListenable: \_isNotified,
builder: (context, isNotified, _) => InkWell(
onTap: \_isLoading ? null : \_handleNotificationToggle,
child: Container(
padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
decoration: BoxDecoration(
color: isNotified ? Colors.transparent : AppColors.primaryColor,
border: Border.all(color: AppColors.primaryColor, width: 1.5),
borderRadius: BorderRadius.circular(4),
),
child: \_isLoading
? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator())
: Row(
children: [
Icon(Icons.notifications, color: isNotified ? AppColors.primaryColor : AppColors.white, size: 18),
const SizedBox(width: 4),
Text(
isNotified ? 'Notification On' : 'Notify Me',
style:GoogleFonts.openSans(
textStyle: TextStyle(
color: isNotified ? AppColors.primaryColor : AppColors.white,
fontSize: 14.sp,
fontWeight: FontWeight.w500,
),
),
),
],
),
),
),
),
if (\_isNotified.value) ...[
const SizedBox(width: 8),
InkWell(
onTap: () => _disableNotification(DateTime.now().add(const Duration(days: 1))),
child: Container(
padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
decoration: BoxDecoration(border: Border.all(color: Colors.red), borderRadius: BorderRadius.circular(4)),
child: const Text('Disable Tomorrow', style: TextStyle(color: Colors.red)),
),
),
],
],
);
}

// Rest of the code remains unchanged
}
Explanation:
\_handleNotificationToggle calls the existing toggleNotification service to subscribe/unsubscribe.
\_disableNotification and \_enableNotification call the new APIs to pause/resume notifications for specific dates.
The disable button appears only when subscribed, targeting tomorrow's occurrence as an example. 2. Update notification_service.dart in /lib/services/notification_service.dart
Ensure FCM token updates and notification toggling work correctly:
dart
class NotificationService {
static final NotificationService \_instance = NotificationService.\_internal();
factory NotificationService() => \_instance;

final FirebaseMessaging \_firebaseMessaging = FirebaseMessaging.instance;

NotificationService.\_internal() {
\_initializeFCM();
}

Future<void> \_initializeFCM() async {
await \_firebaseMessaging.requestPermission();
FirebaseMessaging.onMessage.listen((message) {

    });
    _firebaseMessaging.onTokenRefresh.listen(_updateFCMToken);
    final token = await _firebaseMessaging.getToken();
    if (token != null) await _updateFCMToken(token);

}

Future<void> \_updateFCMToken(String token) async {
final prefs = await SharedPreferences.getInstance();
final userId = prefs.getString('UserID');
final accessToken = prefs.getString('accessToken');
if (userId == null || accessToken == null) return;

    await http.post(
      Uri.parse('http://192.168.0.101:3000/users/$userId/update-fcm'),
      headers: {'Authorization': 'Bearer $accessToken', 'Content-Type': 'application/json'},
      body: jsonEncode({'fcmToken': token}),
    );

}

Future<Map<String, dynamic>> toggleNotification(String eventId) async {
try {
final token = await SharedPreferencesHelper.getAccessToken();
final response = await http.post(
Uri.parse('http://192.168.0.101:3000/notifications/subscribe/$eventId'),
headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'isSubscribed': data['data']['isSubscribed'],
          'message': data['message'],
        };
      } else {
        return {'success': false, 'message': 'Failed to toggle: ${response.body}'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Error: $e'};
    }

}
} 3. Ensure NotificationScreen Displays Notifications
The existing NotificationScreen already fetches and displays notifications. Ensure it reflects subscription status and reminders correctly by using the getUserNotifications API from the backend.
Flow Explanation
When "Notify Me" is Pressed
Frontend:
\_handleNotificationToggle sends a POST request to /notifications/subscribe/:eventId.
Updates \_isNotified and shows a snackbar.
Backend:
Adds the user to notifyTo and creates a subscription notification.
The cron job detects the event and schedules the FCM notification.
One Hour Before date.from
Cron Job:
Checks events where date.from is one hour from now.
For recurring events, calculates the next occurrence (e.g., daily until date.to).
Skips dates in notificationExceptions.
Sends FCM notifications to all notifyTo users' fcmTokens.
Disabling Notifications
Frontend: User clicks "Disable Tomorrow", calling /notifications/disable/:eventId.
Backend: Adds the date to notificationExceptions, skipping the notification for that occurrence.
Enabling Notifications
Frontend: User re-enables, calling /notifications/enable/:eventId.
Backend: Removes the date from notificationExceptions, resuming notifications from the next occurrence.
Example with Provided Data
Event: Non-recurring, date.from = "2025-02-28T18:30:00.000Z".
Notification Time: "2025-02-28T17:30:00.000Z" (1 hour before).
Cron Job: On February 28, 2025, at 17:25-17:30 UTC, sends "Event Reminder: Sudarshan Kriya" to notifyTo user "67bf14d306f618723d815f14".
Handling Recurring Events
Daily Example: If the event were recurring daily from Feb 28 to March 25, 2025:
Notifications sent daily at 17:30 UTC unless disabled.
Disabling March 1 skips that day; enabling resumes from March 2 onward.
This solution integrates FCM push notifications, handles recurring events, and provides disable/enable functionality as requested, fully aligning with your schema and code structure. Let me know if you need further clarification!
