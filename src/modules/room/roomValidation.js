const Joi = require("joi");

const createRoomV = {
  body: Joi.object().keys({
    name: Joi.string().required(),
  }),
};

const addMemberToRoomV = {
  body: Joi.object().keys({
    userId: Joi.string().required(),
    roomId: Joi.string().required(),
  }),
};
const actionOnRoomRequestV = {
  body: Joi.object().keys({
    roomRequestId: Joi.string().required(),
    status: Joi.string().valid("pending", "accepted", "rejected"),
  }),
};

module.exports = {
  createRoomV,
  addMemberToRoomV,
  actionOnRoomRequestV,
};
