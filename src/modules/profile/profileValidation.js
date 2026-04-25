const Joi = require("joi");

// Validation schema for creating a profile
const createProfileV = {
    body: Joi.object().keys({
        userId: Joi.string().messages({
            "string.base": "User ID must be a string",
        }),
        profileImage: Joi.string().trim().uri().messages({
            "string.base": "Profile Image must be a string",
            "string.uri": "Profile Image must be a valid URL",
        }),
        userName: Joi.string().trim().required().messages({
            "string.base": "User Name must be a string",
            "string.empty": "User Name is required",
            "any.required": "User Name is required",
        }),
        fullName: Joi.string().trim().required().messages({
            "string.base": "Full Name must be a string",
            "string.empty": "Full Name is required",
            "any.required": "Full Name is required",
        }),
        email: Joi.string().email().required().messages({
            "string.base": "Email must be a string",
            "string.email": "Email must be a valid email address",
            "string.empty": "Email is required",
            "any.required": "Email is required",
        }),
        mobileNo: Joi.string().pattern(/^[0-9]+$/).required().messages({
            "string.base": "Mobile Number must be a string",
            "string.pattern.base": "Mobile Number must contain only digits",
            "string.empty": "Mobile Number is required",
            "any.required": "Mobile Number is required",
        }),
        isTeacher: Joi.boolean().default(false),
        teacherId: Joi.string().when('isTeacher', {
            is: true,
            then: Joi.required(),
            otherwise: Joi.optional()
        }).messages({
            "string.base": "Teacher ID must be a string",
            "any.required": "Teacher ID is required for teachers",
        }),
    }),
};

// Validation schema for updating a profile
const updateProfileV = {
    body: Joi.object().keys({
        userId: Joi.string().messages({
            "string.base": "User ID must be a string",
        }),
        profileImage: Joi.string().trim().uri().messages({
            "string.base": "Profile Image must be a string",
            "string.uri": "Profile Image must be a valid URL",
        }),
        userName: Joi.string().trim().messages({
            "string.base": "User Name must be a string",
        }),
        fullName: Joi.string().trim().messages({
            "string.base": "Full Name must be a string",
        }),
        email: Joi.string().email().messages({
            "string.base": "Email must be a string",
            "string.email": "Email must be a valid email address",
        }),
        mobileNo: Joi.string().pattern(/^[0-9]+$/).messages({
            "string.base": "Mobile Number must be a string",
            "string.pattern.base": "Mobile Number must contain only digits",
        }),
        isTeacher: Joi.boolean(),
        teacherId: Joi.string().when('isTeacher', {
            is: true,
            then: Joi.required(),
            otherwise: Joi.optional()
        }).messages({
            "string.base": "Teacher ID must be a string",
            "any.required": "Teacher ID is required for teachers",
        }),
    }),
};

// Validation schema for retrieving a profile by ID
const getProfileByIdV = {
    params: Joi.object().keys({
        id: Joi.string().required().messages({
            "string.base": "Profile ID must be a string",
            "any.required": "Profile ID is required",
        }),
    }),
};

module.exports = {
    createProfileV,
    updateProfileV,
    getProfileByIdV,
};