const Joi = require("joi");


const createNotificationV = {
    body: Joi.object().keys({
        title: Joi.string().trim().required().messages({
            "string.base": "Title must be a string",
            "string.empty": "Title is required",
            "any.required": "Title is required",
        }),
        description: Joi.string().trim().required().messages({
            "string.base": "Description must be a string",
            "string.empty": "Description is required",
            "any.required": "Description is required",
        }),
        eventId: Joi.string().required().messages({
            "string.base": "Recipient ID must be a string",
            "string.pattern.base": "Recipient ID must be a valid ObjectId",
            "any.required": "Recipient ID is required",
        }),
        userId: Joi.string().required().messages({
            "string.base": "Recipient ID must be a string",
            "string.pattern.base": "Recipient ID must be a valid ObjectId",
            "any.required": "Recipient ID is required",
        }),
    }),
};

module.exports = {
    createNotificationV,
};
