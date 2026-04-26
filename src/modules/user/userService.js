const { isEmpty, generateJWT } = require("../../common/utils/app_functions");
const User = require("../../models/user");
const appError = require("../../common/utils/appError");
const httpStatus = require("../../common/utils/status.json");
const { createToken } = require("../../middleware/genrateTokens");
const { ROLES } = require("../../common/utils/constants");
const { encode, decode } = require("../../common/utils/crypto");
const { generateOTP } = require("../../common/utils/helpers");

const constants = require("../../common/utils/constants");
const sendSms = require("../../common/utils/messageService");
const OtpRecord = require('../../models/otp');
const { request } = require("express");

function AddMinutesToDate(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}
const userLoginService = async (request) => {
  try {
    const { mobileNo, countryCode } = request.body;
    
    // Validate required fields
    if (!mobileNo || !countryCode) {
      throw new appError(httpStatus.BAD_REQUEST, 'Mobile number and country code are required');
    }

    // Check for Apple Review mock number
    const isAppleReviewNumber = countryCode === '+91' && mobileNo === '1234567890';
    
    // Check if user exists
    const user = await User.findOne({ mobileNo, countryCode });

    let sessionId;
    
    if (isAppleReviewNumber) {
      // Mock OTP system for Apple Review
      console.log('Apple Review Mock: Using demo number, skipping SMS');
      sessionId = 'APPLE_REVIEW_MOCK_SESSION_' + Date.now();
    } else {
      // Regular 2Factor.in API flow
      const API_KEY = process.env.TWO_FACTOR_API_KEY;
      if (!API_KEY) {
        throw new appError(httpStatus.INTERNAL_SERVER_ERROR, 'TWO_FACTOR_API_KEY is not defined');
      }

      // Call 2Factor.in API to send OTP
      const axios = require('axios');
      try {
        const response = await axios.get(
          `https://2factor.in/API/V1/${API_KEY}/SMS/${countryCode}${mobileNo}/AUTOGEN/OTP%20For%20Verification`,
          {
            maxRedirects: 0,
            validateStatus: function (status) {
              return status >= 200 && status < 400;
            }
          }
        );

        if (response.status >= 300 && response.status < 400) {
          console.error('2Factor API returned redirect:', {
            status: response.status,
            location: response.headers.location,
            url: response.config.url
          });
          throw new appError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'OTP service returned an unexpected redirect. Please try again.'
          );
        }

        if (response.data.Status !== "Success") {
          const errorMessage = response.data.Details || 'Failed to send OTP';
          throw new appError(httpStatus.INTERNAL_SERVER_ERROR, errorMessage);
        }
        
        sessionId = response.data.Details;
      } catch (apiError) {
        console.error('2Factor API Error:', {
          status: apiError.response?.status,
          data: apiError.response?.data,
          message: apiError.message,
          url: apiError.config?.url
        });
        
        // Handle redirect responses
        if (apiError.response?.status >= 300 && apiError.response?.status < 400) {
          throw new appError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'OTP service is temporarily unavailable. Please try again later.'
          );
        }
        
        // More specific error handling for phone number format issues
        if (apiError.response?.data?.Details?.includes('Invalid Phone Number')) {
          throw new appError(httpStatus.BAD_REQUEST, 'Invalid phone number format. Please check the number and country code.');
        }
        
        throw new appError(
          httpStatus.INTERNAL_SERVER_ERROR, 
          apiError.response?.data?.Details || 'Failed to send OTP via SMS service'
        );
      }
    }

    // Prepare data for encryption
    const details = {
      sessionId: sessionId,
      expiration_time: AddMinutesToDate(new Date(), 10).toISOString(), // 10 min expiry
      mobile: mobileNo,
      countryCode: countryCode,
      isAppleReview: isAppleReviewNumber
    };

    if (user) {
      details.userId = user._id.toString();
    }

    // Encrypt the session data using AES encryption
    const encryptedData = await encode(JSON.stringify(details));
    
    return { data: encryptedData };
    
  } catch (error) {
    console.error('Login service error:', error);
    throw error instanceof appError ? error : new appError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to process login request'
    );
  }
};


// const verifyOtp = async (request) => {
//   const { otp, data, deviceToken } = request.body;
//   const decoded = await decode(data);
//   const decodedObj = JSON.parse(decoded);
//   const expirationTime = new Date(decodedObj.expiration_time);
//   const currentTime = new Date();
//   if (expirationTime > currentTime) {
//     if (Number(decodedObj.otp) === otp) {
//       let user;
//       if (!decodedObj.userId) {
//         user = await User.create({
//           mobileNo: decodedObj.mobile,
//           countryCode: decodedObj.countryCode,
//           deviceTokens: deviceToken,
//           userName: decodedObj.userName || `user_${decodedObj.mobile}`
//         });
//       }
//       if (decodedObj.userId) {
//         user = await User.findById(decodedObj.userId);
//         if (!user.deviceTokens.includes(deviceToken)) {
//           user = await User.findByIdAndUpdate(
//             user._id,
//             {
//               $push: {
//                 deviceTokens: deviceToken,
//               },
//             },
//             { new: true }
//           );
//         }
//       }
//       return createToken(user);
//     } else {
//       throw new appError(httpStatus.CONFLICT, request.t("user.INCORRECT_OTP"));
//     }
//   } else {
//     throw new appError(httpStatus.CONFLICT, request.t("user.OTP_EXPIRED"));
//   }
// };

// const verifyOtp = async (request) => {
//   const { otp, data, deviceToken } = request.body;
//   const decoded = await decode(data);
//   const decodedObj = JSON.parse(decoded);
//   const expirationTime = new Date(decodedObj.expiration_time);
//   const currentTime = new Date();

//   if (expirationTime <= currentTime) {
//     throw new appError(httpStatus.CONFLICT, request.t("user.OTP_EXPIRED"));
//   }
//   if (Number(decodedObj.otp) !== otp) {
//     throw new appError(httpStatus.CONFLICT, request.t("user.INCORRECT_OTP"));
//   }
//   let user;
//   if (!decodedObj.userId) {
//     // Check if user already exists by mobile number
//     user = await User.findOne({ mobileNo: decodedObj.mobile });
//     if (!user) {
//       // Create new user only if doesn't exist
//       try {
//         user = await User.create({
//           mobileNo: decodedObj.mobile,
//           countryCode: decodedObj.countryCode,
//           deviceTokens: [deviceToken], // Initialize with device token
//           userName: decodedObj.userName || `user_${decodedObj.mobile}`,

//         });
//         console.log(user.userName)
//       } catch (error) {
//         throw new appError(httpStatus.BAD_REQUEST, "Error creating user: " + error.message);
//       }
//     }
//   } else {
//     user = await User.findById(decodedObj.userId);
//     if (!user.deviceTokens.includes(deviceToken)) {
//       user = await User.findByIdAndUpdate(
//         user._id,
//         {
//           $push: {
//             deviceTokens: deviceToken,
//           },
//         },
//         { new: true }
//       );
//     }
//   }

//   return createToken(user);
// };


const verifyOtp = async (request) => {
  try {
    const { otp, deviceToken, data } = request.body;
    
    if (!otp || !data) {
      throw new appError(httpStatus.BAD_REQUEST, "OTP and data are required");
    }

    // Decrypt the session data
    let decodedObj;
    try {
      const decryptedData = await decode(data);
      decodedObj = JSON.parse(decryptedData);
      
      // Validate required fields
      if (!decodedObj.sessionId || !decodedObj.mobile || !decodedObj.countryCode) {
        throw new Error('Missing required fields in encrypted data');
      }
    } catch (decodeError) {
      console.error('Decryption failed:', decodeError);
      throw new appError(httpStatus.BAD_REQUEST, "Invalid encrypted data");
    }


    let isValidOtp = false;

    if (decodedObj.isAppleReview && otp === '482957') {
      console.log('Apple Review Mock: OTP accepted by mock flow');
      isValidOtp = true;
    } else {
      // Verify OTP with 2Factor.in API
      const API_KEY = process.env.TWO_FACTOR_API_KEY;
      const axios = require('axios');
      
      try {
        const response = await axios.get(
          `https://2factor.in/API/V1/${API_KEY}/SMS/VERIFY/${decodedObj.sessionId}/${otp}`,
          {
            maxRedirects: 0,
            validateStatus: function (status) {
              return status >= 200 && status < 400;
            }
          }
        );

        if (response.status >= 300 && response.status < 400) {
          console.error('2Factor API returned redirect during verification:', {
            status: response.status,
            location: response.headers.location,
            url: response.config.url
          });
          throw new appError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'OTP verification service returned an unexpected redirect. Please try again.'
          );
        }

        if (response.data.Status === "Success") {
          isValidOtp = true;
        }
      } catch (apiError) {
        console.error('2Factor API Verification Error:', {
          status: apiError.response?.status,
          data: apiError.response?.data,
          message: apiError.message,
          url: apiError.config?.url
        });
        
        // Handle redirect responses
        if (apiError.response?.status >= 300 && apiError.response?.status < 400) {
          throw new appError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'OTP verification service is temporarily unavailable. Please try again later.'
          );
        }
        
        // Don't set isValidOtp to true, let it remain false
      }
    }

    if (!isValidOtp) {
      throw new appError(httpStatus.BAD_REQUEST, "Invalid OTP");
    }

    // Find or create user
    let user = await User.findOne({ 
      mobileNo: decodedObj.mobile,
      countryCode: decodedObj.countryCode 
    });

    const isNewUser = !user;

    if (!user) {
      // Create new user
      const newUser = {
        mobileNo: decodedObj.mobile,
        countryCode: decodedObj.countryCode,
        role: ROLES.USER,
        deviceTokens: deviceToken ? [deviceToken] : [],
        refreshTokens: [],
        isOnboarded: false,
        name: '',
        email: '',
        userName: `user_${decodedObj.mobile}`,
        profileImage: '',
        teacherRoleApproved: 'pending',
        teacherId: '',
        teacherIdCard: '',
        geometry: {
          type: 'Point',
          coordinates: [0, 0]
        },
        nearByVisible: false,
        locationSharing: false,
        bio: '',
        ...(deviceToken ? { fcmToken: deviceToken } : {})
      };
      
      user = await User.create(newUser);
    } else {
      // Update existing user's device token
      if (deviceToken && !user.deviceTokens.includes(deviceToken)) {
        user.deviceTokens = [...user.deviceTokens, deviceToken];
      }
      if (deviceToken) {
        user.fcmToken = deviceToken;
      }

      // Clean up refresh tokens
      if (!Array.isArray(user.refreshTokens)) {
        user.refreshTokens = [];
      }

      user.refreshTokens = user.refreshTokens.filter(token => 
        token && 
        typeof token === 'object' && 
        token.token && 
        token.expiresAt
      );

      await user.save();
    }

    // Generate JWT tokens
    const { accessToken, refreshToken, accessExpiration, refreshExpiration } = 
      await createToken(user._id.toString());

    return {
      user,
      isNewUser,
      accessToken,
      refreshToken,
      accessExpiration,
      refreshExpiration
    };
    
  } catch (error) {
console.error('OTP Verification Error:', error);
    throw error instanceof appError ? error : new appError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to verify OTP'
    );
  }
};


const updateLocation = async (request) => {
  const { lat, long, location } = request.body;

  return await User.findByIdAndUpdate(
    request.user.id,
    {
      location: location,
      latlong: {
        type: "Point",
        coordinates: [parseFloat(long), parseFloat(lat)],
      },
    },
    {
      new: true,
    }
  );
};

const onBoardUser = async (request) => {
  const { name, email, userName, mobileNo, bio, teacherId, role } = request.body || {};

  // URLs from Firebase upload performed in controller
  const uploaded = request.uploadedFiles || {};
  const profileImg = uploaded.profileImage; // undefined if not uploaded
  const teacherIdCard = uploaded.teacherIdCard; // undefined if not uploaded

  // Normalize email if provided
  const Email = typeof email === 'string' && email.length > 0 ? email.toLowerCase() : undefined;

  // Uniqueness checks only for provided fields
  if (Email) {
    const isExistingEmail = await User.findOne({ email: Email, _id: { $ne: request.user.id } });
    if (isExistingEmail) {
      throw new appError(httpStatus.CONFLICT, request.t("user.EMAIL_EXISTENT"));
    }
  }

  if (typeof userName === 'string' && userName.length > 0) {
    const isExistingUserName = await User.findOne({ userName: userName, _id: { $ne: request.user.id } });
    if (isExistingUserName) {
      throw new appError(httpStatus.CONFLICT, request.t("user.UserName_EXISTENT"));
    }
  }

  // Build the update payload only with provided values
  const update = { isOnboarded: true };
  if (typeof name === 'string') update.name = name;
  if (Email) update.email = Email;
  if (typeof mobileNo === 'string') update.mobileNo = mobileNo;
  if (typeof userName === 'string') update.userName = userName;
  if (typeof bio === 'string') update.bio = bio;
  if (profileImg) update.profileImage = profileImg; // don't overwrite if undefined

  if (role === ROLES.TEACHER) {
    update.role = ROLES.TEACHER;
    if (typeof teacherId === 'string') update.teacherId = teacherId;
    if (teacherIdCard) update.teacherIdCard = teacherIdCard;
  } else if (role === ROLES.USER) {
    update.role = ROLES.USER;
  }

  return await User.findByIdAndUpdate(
    request.user.id,
    { $set: update },
    { new: true }
  );
};

async function addTeacherRole(request, params) {
  try {
    const user = await User.findById(request.user.id);
    if (user) {
      return await User.findByIdAndUpdate(
        request.user.id,
        {
          teacherId: params.teacherId,
          teacherIdCard: params.teacherIdCard[0].link,
          role: ROLES.TEACHER,
        },
        { new: true }
      );
    } else {
      throw new appError(
        httpStatus.NOT_FOUND,
        request.t("user.USER_NOT_FOUND")
      );
    }
  } catch (error) {
    throw new appError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
}

async function updateUser(params, request) {
  const currentUser = request.user;
  try {
    const user = await User.findById(request.user.id);
    if (user) {
      if (!isEmpty(params.email)) {
        const emailedUser = await User.findOne({ email: params.email });
        if (isEmpty(emailedUser)) {
          user.email = params.email;
          await user.save();
        } else {
          throw new appError(
            httpStatus.CONFLICT,
            request.t("user.EMAIL_EXISTENT")
          );
        }
      }
      if (params.isTeacher) {
        user.teacherId = params.teacherId;
        await user.save();
      }
      if (
        !isEmpty(params.mobileNo) &&
        !isEmpty(params.countryCode) &&
        params.mobileNo != currentUser.mobileNo
      ) {
        const mobiledUser = await User.findOne({
          mobileNo: params.mobileNo,
          countryCode: params.countryCode,
        });
        if (isEmpty(mobiledUser)) {
          user.mobileNo = params.mobileNo;
          user.countryCode = params.countryCode;
          await user.save();
        } else {
          throw new appError(
            httpStatus.CONFLICT,
            request.t("user.MOBILE_EXISTENT")
          );
        }
      }
      if (!isEmpty(params.fullName)) {
        user.fullName = params.fullName;
        await user.save();
      }

      if (
        !isEmpty(params.userName) &&
        params.userName != currentUser.userName
      ) {
        const userWithUserName = await User.findOne({
          userName: params.userName,
          deletedAt: null,
        });
        if (isEmpty(userWithUserName)) {
          user.userName = params.userName;
        } else {
          throw new appError(
            httpStatus.CONFLICT,
            request.t("user.USER_NAME_EXISTENT")
          );
        }
      }
      if (!isEmpty(params.location)) {
        user.location = params.location;
      }
      await user.save();
      returnVal.data = user;
    } else {
      throw new appError(
        httpStatus.NOT_FOUND,
        request.t("user.USER_NOT_FOUND")
      );
    }
    return returnVal;
  } catch (error) {
    throw new appError(error.status, error.message);
  }
}

async function getUser(currentUser) {
  try {
    const user = await User.findById(currentUser).select('-refreshTokens');
    if (!user) {
      throw new appError(httpStatus.NOT_FOUND, "User not found");
    }
    if (user.deletedAt) {
      throw new appError(httpStatus.GONE, "User account has been deleted");
    }
    return user;
  } catch (error) {
    throw error;
  }
}

async function getAllUsers() {
  return await User.aggregate([{ $match: { deletedAt: null } }]);
}

async function getUserAddress(request) {
  return await User.findById(request.user.id).select("address -_id");
}

async function getAllTeachers() {
  return await User.find({ role: ROLES.TEACHER });
}

async function actionOnTeacherAccount(request) {
  let { status, id } = request.query;

  try {
    const user = await User.findById(id);
    if (!user) {
      throw new appError(
        httpStatus.NOT_FOUND,
        request.t("user.TEACHER_NOT_FOUND")
      );
    }

    return await User.findByIdAndUpdate(
      id,
      {
        teacherRoleApproved: status,
        teacherRequestHandledBy: request.user.id,
      },
      { new: true }
    );
  } catch (error) {
    throw new appError(error.status, error.message);
  }
}

async function getTeachersRequest(request) {
  try {
    return await User.find({
      role: constants.ROLES.TEACHER,
      teacherRoleApproved: constants.STATUS.PENDING,
    });
  } catch (error) {
    throw new appError(error.status, error.message);
  }
}

async function uploadDocuments(params, request) {
  try {
    const user = await User.findById(request.user.id);
    if (user) {
      user.profileImageUrl = params[0].link;
      await user.save();
      return user;
    } else {
      throw new appError(
        httpStatus.NOT_FOUND,
        request.t("user.USER_NOT_FOUND")
      );
    }
  } catch (error) {
    throw new appError(error.status, error.message);
  }
}

async function updateSocialMediaLinks(request) {
  return await User.findByIdAndUpdate(
    request.user.id,
    { ...request.body },
    { new: true }
  );
}

async function locationSharing(request) {
  return await User.findByIdAndUpdate(
    request.user.id,
    { ...request.body },
    { new: true }
  );
}

const getSocialMedia = async (request) => {
  try {
    const userId = request.params.userId;
    if (!userId) {
      throw new appError(httpStatus.BAD_REQUEST, 'User ID is required');
    }

    let user;
    try {
      user = await User.findById(userId).select('youtubeUrl xUrl instagramUrl');
    } catch (e) {
      // Invalid ObjectId format
      throw new appError(httpStatus.BAD_REQUEST, 'Invalid user ID');
    }

    if (!user) {
      throw new appError(httpStatus.NOT_FOUND, 'User not found');
    }

    const socialLinks = {
      youtube: user.youtubeUrl || null,
      x: user.xUrl || null,
      instagram: user.instagramUrl || null,
    };

    return socialLinks;
  } catch (error) {
    // Re-throw appError or wrap others
    if (error instanceof appError) {
      throw error;
    }
    throw new appError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to retrieve social media links');
  }
};

const getNearbyVisibleUsers = async (longitude, latitude, radius = 1000) => {
  try {
    const users = await User.find({
      latlong: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: radius,
        },
      },
    }).select("userName profileImage role")

    return users;
  } catch (error) {
    throw new Error("Error fetching nearby users: " + error.message);
  }
};


const updateUserService = async (request) => {
  return await User.findByIdAndUpdate(request.params.userId,
    { ...request.body },
    { new: true }
  )
};


const searchAllUserService = async (request) => {
  try {
    const { userName } = request.query;

    let filter = {};

    // If userName is provided, create a regex for case-insensitive search
    if (userName) {
      const query = userName.trim();
      filter["userName"] = { $regex: new RegExp(query, "i") };
    }

    // Fetch users based on the filter
    const users = await User.find(filter);

    // Return the filtered or complete user list
    return {
      message: "User.EditUser",
      data: users,
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error("User not found");
  }
};

const checkUserRoleService = async (request) => {
  try {
    const { userName } = request.query;
    if (!userName) {
      throw new Error("Username is required");
    }

    const query = userName.trim();
    const user = await User.findOne({ userName: { $regex: new RegExp(`^${query}$`, "i") } });

    if (!user) {
      return {
        message: "No teacher found with the provided teacherName.",
      };
    }

    if (user.role === constants.ROLES.TEACHER) {
      return {
        message: "User found",
        data: {
          userName: user.userName,
          email: user.email,
          teacherId: user.teacherId,
          id: user._id,
        },
      };
    } else {
      return {
        message: "User is not a teacher",
      };
    }
  } catch (error) {
    console.error("Error checking user role:", error);
    throw new Error(error.message || "An error occurred while checking the user role");
  }
};


// Updates the user's FCM token and keeps deviceTokens in sync (no duplicates)
const updateFcmToken = async (userId, fcmToken) => {
  if (!userId || !fcmToken) {
    throw new appError(httpStatus.BAD_REQUEST, 'UserId and fcmToken are required');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new appError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Update fcmToken field
  user.fcmToken = fcmToken;

  // Ensure deviceTokens is an array and contains the token at most once
  if (!Array.isArray(user.deviceTokens)) {
    user.deviceTokens = [];
  }
  const exists = user.deviceTokens.includes(fcmToken);
  if (!exists) {
    user.deviceTokens.push(fcmToken);
  }

  await user.save();
  return user;
};

// Hard delete a user by ID, restricted to admin usage via controller/route
async function deleteUserById(adminId, targetUserId) {
  try {
    if (!targetUserId) {
      throw new appError(httpStatus.BAD_REQUEST, 'UserId is required');
    }

    // Prevent self-deletion for admin invoking the action
    if (adminId && adminId.toString() === targetUserId.toString()) {
      throw new appError(httpStatus.BAD_REQUEST, 'Admins cannot delete their own account');
    }

    const deleted = await User.findByIdAndDelete(targetUserId);
    if (!deleted) {
      throw new appError(httpStatus.NOT_FOUND, 'User not found');
    }
    return deleted;
  } catch (error) {
    throw error instanceof appError ? error : new appError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to delete user'
    );
  }
}

// Hard delete self account by ID (no self-block)
async function deleteSelfById(userId) {
  try {
    if (!userId) {
      throw new appError(httpStatus.BAD_REQUEST, 'UserId is required');
    }

    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) {
      throw new appError(httpStatus.NOT_FOUND, 'User not found');
    }
    return deleted;
  } catch (error) {
    throw error instanceof appError ? error : new appError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to delete account'
    );
  }
}

module.exports = {
  userLoginService,
  updateLocation,
  onBoardUser,
  updateUser,
  getUser,
  uploadDocuments,
  addTeacherRole,
  getAllUsers,
  actionOnTeacherAccount,
  getAllTeachers,
  verifyOtp,
  getTeachersRequest,
  locationSharing,
  updateSocialMediaLinks,
  getSocialMedia,
  getNearbyVisibleUsers,
  updateUserService,
  searchAllUserService,
  checkUserRoleService,
  updateFcmToken,
  deleteUserById,
  deleteSelfById

};
