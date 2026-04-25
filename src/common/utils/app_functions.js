const joi = require("joi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

async function isValidObject(payLoad, validation) {
  try {
    const validationObject = joi.object(validation);
    await validationObject.validateAsync(payLoad);
    return { status: true };
  } catch (error) {
    return { status: false, error: error.message };
  }
}

function isEmpty(value) {
  return value == null || value === undefined || value.length <= 0;
}

async function generateBcrypt(password) {
  let hash = await bcrypt.hash(password, 10);
  return hash;
}

async function campareBcrypt(hash, password) {
  return bcrypt.compare(password, hash);
}

function generateJWT(payLoad, secret) {
  payLoad = JSON.parse(JSON.stringify(payLoad));
  const token = jwt.sign(payLoad, secret, { expiresIn: '365d' });
  return token;
}

function campareJWT(token, secret) {
  try {
    var decoded = jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    return { error: error.message };
  }
}

function generateOtp() {
  return Math.floor(Math.random() * (999999 - 100000) + 100000).toString();
}

function generateRandomHash(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);  // deg2rad below
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}

module.exports = {
  isValidObject,
  isEmpty,
  generateBcrypt,
  campareBcrypt,
  generateJWT,
  generateOtp,
  campareJWT,
  generateRandomHash,
  getDistance
};
