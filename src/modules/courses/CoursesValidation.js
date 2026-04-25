const Joi = require("joi");
const createEventV = {
  body: Joi.object().keys({
    title: Joi.string().trim().required().messages({
      "string.base": "Title must be a string",
      "string.empty": "Title is required",
      "any.required": "Title is required",
    }),
    mode: Joi.string().valid("online", "offline", "both","online,offline").required().messages({
      "any.only": 'Mode must be one of "online", "offline", or "both"',
      "any.required": "Mode is required",
    }),
    aol: Joi.array()
      .items(Joi.string().valid("event", "course", "follow-up"))
      .required()
      .messages({
        "any.only": 'AOL must be one of "event", "course", or "follow-up"',
        "any.required": "AOL is required",
      }),
    date: Joi.object({
      from: Joi.date().required().messages({
        "date.base": 'Date "from" must be a valid date',
        "any.required": 'Date "from" is required',
      }),
      to: Joi.date().required().messages({
        "date.base": 'Date "to" must be a valid date',
        "any.required": 'Date "to" is required',
      }),
    }),
    timeOffset: Joi.string(),
    duration: Joi.array().items(Joi.string()),
    meetingLink: Joi.string().trim(),
    recurring: Joi.boolean(),
    description: Joi.array().items(Joi.string()),
    address: Joi.array().items(Joi.string()),
    phoneNumber: Joi.string(),
    registrationLink: Joi.string(),

    coordinates: Joi.array().items(Joi.number()).length(2),

    teachers: Joi.array().items(Joi.string()),
    deletedAt: Joi.date(),
  }),
};

const getEventsV = {
  // body: Joi.object().keys({
  //   // mode: Joi.string().valid("online", "offline", "both"),
  //   // date: Joi.date(),
  //   // lat: Joi.number(),
  //   // long: Joi.number(),
  //   // aol:,
  //   // course,
  //   // date,
  //   // month,
  //   // year,
  //   // lat,
  //   // long,
  // }),
};

module.exports = {
  createEventV,
  getEventsV,
};
