// Legacy compatibility wrapper — uses centralized firebase-config.js
const { admin } = require("../../config/firebase-config");

module.exports = {
  firebase: admin,
};
