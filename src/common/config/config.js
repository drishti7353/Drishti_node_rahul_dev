"use strict";
const dotenv = require("dotenv");
const Joi = require("joi");
const path = require("path");
// require("../../../.env");
dotenv.config({ path: path.join(__dirname, "../../../.env") });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string()
      .valid("production", "development", "test")
      .required(),
    PORT: Joi.number().default(3000),
    DB_URI: Joi.string().default('').description("Mongo DB url"),
    JWT_SECRET: Joi.string().default('changeme').description("JWT secret key"),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number()
    .default(60)  // 1 hour
    .description("Minutes after which access tokens expire"),
  
  JWT_REFRESH_EXPIRATION_DAYS: Joi.number()
    .default(30)  // 30 days
    .description("days after which refresh tokens expire"),
    TWILIO_ACCOUNT_SID: Joi.string().default(''),
    TWILIO_AUTH_TOKEN: Joi.string().default(''),
    TWILIO_PHONE_NUMBER: Joi.string().default(''),
    CRYPT_PASSWORD: Joi.string().default(''),
    IV: Joi.string().default(''),
    CLOUDINARY_CLOUD_NAME: Joi.string().default(''),
    CLOUDINARY_API_KEY: Joi.string().default(''),
    CLOUDINARY_API_SECRET: Joi.string().default(''),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: "key" } })
  .validate(process.env);

if (error) {
  console.error(`⚠️  Config validation warning: ${error.message}`);
  console.error('⚠️  Some features may not work until all environment variables are set.');
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoose: {
    url: envVars.DB_URI + (envVars.NODE_ENV === "test" ? "-test" : ""),
    options: {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    },
  },

  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: envVars.JWT_RESET_EXPIRATION_MINUTES,
    verifyPasswordExpirationMinutes: envVars.JWT_VERIFY_EXPIRATION_MINUTES, // expire token after 1 year
  },
  sms: {
    twilioAccountSid: envVars.TWILIO_ACCOUNT_SID,
    twilioAuthToken: envVars.TWILIO_AUTH_TOKEN,
    twilioPhoneNumber: envVars.TWILIO_PHONE_NUMBER,
  },
  crypto: {
    Iv: envVars.IV,
    CryptoPassword: envVars.CRYPT_PASSWORD,
  },
  cloudinary: {
    cloudName: envVars.CLOUDINARY_CLOUD_NAME,
    apiKey: envVars.CLOUDINARY_API_KEY,
    apiSecret: envVars.CLOUDINARY_API_SECRET,
  },
};
