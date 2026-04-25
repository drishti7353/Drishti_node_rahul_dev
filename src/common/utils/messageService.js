// "use strict";
// const config = require("../config/config");
// const appError = require("./appError");
// const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

// const sns = new SNSClient({
//   region: config.aws.awsRegion,
//   credentials: {
//     accessKeyId: config.aws.awsAccessKeyId,
//     secretAccessKey: config.aws.awsSecretAccessKey,
//   },
// });

// const sendSms = async () => {
//   //console.log("Sending SMS");
//   try {
//     const params = {
//       Message: "this is otp 123",
//       PhoneNumber: "9766619238",
//       // PhoneNumber: "+918605340664",

//       MessageAttributes: {
//         "AWS.SNS.SMS.SenderID": {
//           DataType: "String",
//           StringValue: "String",
//         },
//       },
//     };
//     const command = new PublishCommand(params);
//     const message = await sns.send(command);
//     //console.log("message====", message);
//     return message;
//   } catch (err) {
//     //console.log("error-", err);
//     throw new appError(err.statusCode, err.message);
//   }
// };
// // sendSms();
// module.exports = sendSms;

// const verifySid = "VA3ca59c0f7421dd4cf8e6ee69685ccead";

"use strict";
const twilio = require("twilio");
const config = require("../config/config");
const status = require("../utils/status.json");
const appError = require("./appError");

const client = twilio(config.sms.twilioAccountSid, config.sms.twilioAuthToken);

const sendSms = async (toNo, body) => {
  try {
    const sms = await client.messages.create({
      body: body,
      to: toNo,
      from: config.sms.twilioPhoneNumber,
    });
  } catch (error) {
    throw new appError(status.CONFLICT, error.message);
  }
};

module.exports = sendSms;
