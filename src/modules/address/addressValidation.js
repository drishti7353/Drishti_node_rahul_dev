const Joi = require("joi");

const addressCreateV = {
  body: Joi.object().keys({
    title: Joi.string().allow('').optional(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    country: Joi.string().required(),
    pin: Joi.string().required(),
    location: Joi.string().optional(),
    latlong: Joi.object().keys({
      type: Joi.string().valid('Point').required(),
      coordinates: Joi.array().items(Joi.number()).length(2).required(),
    }).required(),
    lat: Joi.number().optional(),
    long: Joi.number().optional(),
    address: Joi.string().required(),
    userId: Joi.string().required(),
  }),
};

const addressUpdateV = {
  body: Joi.object().keys({
    title: Joi.string().allow('').optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    country: Joi.string().optional(),
    pin: Joi.string().optional(),
    location: Joi.string().optional(),
    latlong: Joi.object().keys({
      type: Joi.string().valid('Point'),
      coordinates: Joi.array().items(Joi.number()).length(2),
    }).optional(),
    lat: Joi.number().optional(),
    long: Joi.number().optional(),
    address: Joi.string().optional(),
    userId: Joi.string().optional(),
  }),
};

module.exports = {
  addressCreateV,
  addressUpdateV,
};
