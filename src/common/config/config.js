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
    DB_URI: Joi.string().required().description("Mongo DB url"),
    JWT_SECRET: Joi.string().required().description("JWT secret key"),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number()
    .default(60)  // 1 hour
    .description("Minutes after which access tokens expire"),
  
  JWT_REFRESH_EXPIRATION_DAYS: Joi.number()
    .default(30)  // 30 days
    .description("days after which refresh tokens expire"),
    TWILIO_ACCOUNT_SID: Joi.string().required(),
    TWILIO_AUTH_TOKEN: Joi.string().required(),
    TWILIO_PHONE_NUMBER: Joi.string().required(),
    CRYPT_PASSWORD: Joi.string().required(),
    IV: Joi.string().required(),
    AWS_ACCESS_KEY_ID: Joi.string().required(),
    AWS_SECRET_ACCESS_KEY: Joi.string().required(),
    AWS_REGION: Joi.string().required(),
    S3_BUCKET_NAME: Joi.string().required(),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: "key" } })
  .validate(process.env);

if (error) {
  ////console.log(error);
  throw new Error(`Config validation error: ${error.message}`);
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
  aws: {
    awsAccessKeyId: envVars.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
    awsRegion: envVars.AWS_REGION,
    s3Bucket: envVars.S3_BUCKET_NAME,
  },
};
