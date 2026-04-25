const Joi = require("joi");
const constants = require("../../common/utils/constants");

const createEventV = {
  body: Joi.object().keys({
    description: Joi.string().trim().allow('', null).messages({
      "string.base": "Description must be a string",
    }),
    mode: Joi.alternatives().try(
      Joi.string().valid("online", "offline", "both", "online,offline", "offline,online"),
      Joi.array().items(Joi.string().valid("online", "offline","online,offline"))
    ).required().messages({
      "any.required": "Mode is required",
      "any.only": 'Mode must be "online", "offline", "both", or an array of these values',
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
    duration: Joi.array().items(
      Joi.object({
        from: Joi.string().valid(...constants.TIME_INTERVALS),
        to: Joi.string().valid(...constants.TIME_INTERVALS),
      })
    ),
    meetingLink: Joi.string().trim().allow('', null),
    meetingId: Joi.string().trim().allow('', null),
    recurring: Joi.boolean(),
    recurringPattern: Joi.object({
      frequency: Joi.string().valid('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'),
      interval: Joi.number().integer().min(1),
      count: Joi.number().integer().min(1),
      until: Joi.alternatives().try(
        Joi.date().iso(), 
        Joi.string().isoDate()
      )
    }),
    title: Joi.array().items(Joi.string().trim()),
    address: Joi.array().items(Joi.string()),
    phoneNumber: Joi.string(),
    registrationLink: Joi.string().trim().uri().allow('', null).messages({
      'string.uri': 'Registration link must be a valid URL'
    }),
    coordinates: Joi.array().items(Joi.number()).length(2),
    teachers: Joi.array().items(Joi.string()),
    deletedAt: Joi.date(),
  }),
};

const getEventsV = {
  body: Joi.object().keys({
    mode: Joi.string().valid("online", "offline", "both"),
    date: Joi.date(),
    page: Joi.number().integer().min(1),
    pageSize: Joi.number().integer().min(1).max(100)
  })
};

const subscribeToEventV = {
  params: Joi.object().keys({
    eventId: Joi.string().required().messages({
      "string.base": "Event ID must be a string",
      "any.required": "Event ID is required",
    }),
  }),
};

const editEventV = {
  body: Joi.object().keys({
    title: Joi.array().items(Joi.string().trim()),
    mode: Joi.string().valid("online", "offline", "both","online,offline"),
    aol: Joi.array().items(Joi.string().valid("event", "course", "follow-up")),
    date: Joi.object({
      from: Joi.date().iso(),
      to: Joi.date().iso()
    }),
    timeOffset: Joi.string(),
    duration: Joi.array().items(
      Joi.object({
        from: Joi.string().valid(...constants.TIME_INTERVALS),
        to: Joi.string().valid(...constants.TIME_INTERVALS),
      })
    ),
    meetingLink: Joi.string().allow('', null),
    meetingId: Joi.string().allow('', null),
    recurring: Joi.boolean(),
    recurringPattern: Joi.object({
      frequency: Joi.string().valid('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'),
      interval: Joi.number().integer().min(1),
      count: Joi.number().integer().min(1),
      until: Joi.alternatives().try(
        Joi.date().iso(), 
        Joi.string().isoDate()
      )
    }),
    description: Joi.string().allow('', null),
    address: Joi.array().items(Joi.string()),
    phoneNumber: Joi.alternatives().try(
      Joi.string(),
      Joi.array().items(Joi.string())
    ),
    registrationLink: Joi.string().allow('', null),
    coordinates: Joi.array().items(Joi.number()).length(2),
    location: Joi.object({
      type: Joi.string().valid("Point"),
      coordinates: Joi.array().items(Joi.number()).length(2)
    }),
    teachers: Joi.array().items(Joi.string()),
  }),
  params: Joi.object({
    id: Joi.string().required()
  })
};

const manageTitlesV = {
  body: Joi.object().keys({
    title: Joi.string().trim().required().messages({
      "string.base": "Title must be a string",
      "string.empty": "Title is required",
      "any.required": "Title is required",
    }),
    createdBy: Joi.string().trim().required().messages({
      "string.base": "createdBy must be a string",
      "string.empty": "createdBy is required",
      "any.required": "createdBy is required",
    }),
  }),
  query: Joi.object().keys({
    action: Joi.string().valid('create', 'get').default('get')
  })
};

module.exports = {
  createEventV,
  getEventsV,
  subscribeToEventV,
  editEventV,
  manageTitlesV
};
