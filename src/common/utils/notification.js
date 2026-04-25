// const admin = require("firebase-admin");
// const serviceAccount = require("../utils/firebase_admin.json");

// admin.initializeApp(
//   {
//     credential: admin.credential.cert(serviceAccount),
//   },
//   "srisridrishti-c1673"
// );

// const messaging = admin.messaging();

// async function sendNotification(title, body, token) {
//   const serverKey = process.env.FIREBASE_SERVER_KEY;
//   const fcm = new FCM(serverKey);
//   const messageData = {
//     to: token,

//     // to: '/topics/all',
//     notification: {
//       title,
//       body,
//     },

//     data: {
//       my_key: 'my value',
//       my_another_key: 'my another value',
//     },
//   };
//   const notification = fcm.send(messageData, function (err, response) {
//     if (err) {
//       // eslint-disable-next-line no-console
//       //console.log('Error sending notification:', err);
//     } else {
//       // eslint-disable-next-line no-console
//       //console.log('Notification sent successfully:', response);
//     }
//   });
//   return notification;
// }

// const sendNotification = async (
//   body,
//   title,
//   token,
//   id,
//   screen,
//   notificationId
// ) => {
//   try {
//     const notification = await messaging.send({
//       notification: {
//         body: body,
//         title: title,
//       },
//       data: {
//         id: id,
//         screen: screen,
//         notificationId: notificationId,
//       },

//       token: token,
//     });
//   } catch (error) {
//     //console.log("error---", error);
//   }
// };

const sendNotification = async (
  body,
  title,
  token,
  id,
  screen,
  notificationId
) => {
  try {
    const notification = await messaging.send({
      notification: {
        body: "body",
        title: "title",
      },
      data: {
        id: "id",
        screen: "screen",
        notificationId: "notificationId",
      },

      token:
        "fbuShgElTWKAqx8Po3RQt3:APA91bHeQR5VtLhqYobEqC8OZu0e9OFJmSvUVhPw6i7OUrgPg1yaFK2rBSIC8nbVj44eIrh-HJNgaRuFH093VjTr3Mf7mqYHM4rjV6pPEZHdG-EMuYgrhI1evoJW0RMmDr6-keW2VP2P",
    });
  } catch (error) {
    //console.log("error---", error);
  }
};
// sendNotification();
module.exports = { sendNotification };
