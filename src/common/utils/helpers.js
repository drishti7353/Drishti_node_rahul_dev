const { EARTH_RADIUS_METERS } = require("./constants");

const generateOTP = function generateOTP() {
  const min = 1000;
  const max = 9999;
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;
  const otpString = otp.toString();
  return otpString;
};

/**
 * Converts meters to latitude degrees
 * @param {number} meters - Distance in meters
 * @returns {number} - Distance in degrees
 */
function metersToLatDegrees(meters) {
  return (meters / EARTH_RADIUS_METERS) * (180 / Math.PI);
}

/**
 * Converts meters to longitude degrees based on latitude
 * @param {number} meters - Distance in meters
 * @param {number} lat - Latitude
 * @returns {number} - Distance in degrees
 */
function metersToLonDegrees(meters, lat) {
  return (
    (meters / (EARTH_RADIUS_METERS * Math.cos((lat * Math.PI) / 180))) *
    (180 / Math.PI)
  );
}

/**
 * Distorts the given latitude and longitude by up to 1 km
 * @param {number} lat - Original latitude
 * @param {number} lon - Original longitude
 * @returns {{latitude: number, longitude: number}} - Distorted coordinates
 */
const MAX_OFFSET_METERS = 1000; // Customizable value

function distortCoordinates(lat, lon) {
  const latOffset = (Math.random() - 0.5) * 2 * MAX_OFFSET_METERS;
  const lonOffset = (Math.random() - 0.5) * 2 * MAX_OFFSET_METERS;

  // Convert offset meters to degrees
  const distortedLat = lat + metersToLatDegrees(latOffset);
  const distortedLon = lon + metersToLonDegrees(lonOffset, lat);

  return { latitude: distortedLat, longitude: distortedLon };
}

module.exports = {
  generateOTP,
  distortCoordinates,
};
