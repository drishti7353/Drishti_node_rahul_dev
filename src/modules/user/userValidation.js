const Joi = require("joi");
const constants = require("../../common/utils/constants");

const onBoardUserV = {
  body: Joi.object().keys({
    userName: Joi.string().required().trim(),
    name: Joi.string().required().trim(),
    email: Joi.string().email().allow('').trim(),
    mobileNo: Joi.string().allow('').trim(),
    role: Joi.string()
      .default(constants.ROLES.USER)
      .custom((value, helpers) => {
        // Convert 'student' to 'user' for backward compatibility
        if (value && value.toLowerCase() === 'student') {
          return constants.ROLES.USER;
        }
        // Convert to lowercase for consistency
        return value ? value.toLowerCase() : constants.ROLES.USER;
      }),
    bio: Joi.string().allow('').trim().default(''),
    teacherId: Joi.when('role', {
      is: constants.ROLES.TEACHER,
      then: Joi.string().required().trim(),
      otherwise: Joi.string().allow('').optional()
    }),
    // youtubeUrl: Joi.string().allow('').trim().uri().optional().default(''),
    // xUrl: Joi.string().allow('').trim().uri().optional().default(''),
    // instagramUrl: Joi.string().allow('').trim().uri().optional().default(''),
    nearByVisible: Joi.string().allow('true', 'false').default('false'),
    locationSharing: Joi.string().allow('true', 'false').default('false')
  }).unknown(true) // Allow unknown keys for file uploads
};

const userLoginV = {
  body: Joi.object().keys({
    mobileNo: Joi.string().required(),
    countryCode: Joi.string(),
    type: Joi.string().required(),
  }),
};

const updateLocationV = {
  body: Joi.object().keys({
    lat: Joi.number().required(),
    long: Joi.number().required(),
    location: Joi.string().required(),
  }),
};
const searchTeacherV = {
  query: Joi.object().keys({
    userName: Joi.string().allow('').optional(),
  }),
};


const updateSocialMediaLinksV = {
  body: Joi.object().keys({
    youtubeUrl: Joi.string().allow(""),
    xUrl: Joi.string().allow(""),
    instagramUrl: Joi.string().allow(""),
  }),
};

const actionOnTeacherAccountV = {
  body: Joi.object().keys({
    id: Joi.string(),
    status: Joi.string().valid(
      constants.STATUS.PENDING,
      constants.STATUS.ACCEPTED,
      constants.STATUS.REJECTED
    ),
  }),
};

const teachersListingV = {
  query: Joi.object().keys({
    status: Joi.string().valid(
      constants.STATUS.PENDING,
      constants.STATUS.ACCEPTED,
      constants.STATUS.REJECTED
    ),
    search: Joi.string(),
  }),
};

const addressSchema = Joi.object({
  title: Joi.string().required(),
  address: Joi.string().required(),
  city: Joi.string().allow('', null),
  state: Joi.string().allow('', null),
  country: Joi.string().allow('', null),
  pin: Joi.string().allow('', null),
  latlong: Joi.object({
    coordinates: Joi.array().items(Joi.number()).length(2)
  }).required(),
  userId: Joi.string().required()
});

module.exports = {
  updateLocationV,
  onBoardUserV,
  userLoginV,
  actionOnTeacherAccountV,
  teachersListingV,
  updateSocialMediaLinksV,
  searchTeacherV,
  addressSchema
};
