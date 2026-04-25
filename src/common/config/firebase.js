const firebase = require("firebase-admin");
const credentials = require("./credentials.json");

firebase.initializeApp({
  credential: firebase.credential.cert(credentials),
  storageBucket: "drishti-3dd03.appspot.com",
});
module.exports = {
  firebase,
};
