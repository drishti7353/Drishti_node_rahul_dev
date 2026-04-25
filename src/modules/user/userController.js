const userService = require("../user/userService");
const userValidation = require("../user/userValidation");
const constants = require("../../common/utils/constants");
const appError = require("../../common/utils/appError");
const createResponse = require("../../common/utils/createResponse");
const httpStatus = require("../../common/utils/status.json");
const uploadFilesToBucket = require("../../middleware/uploadTofireBase");
const User = require('../../models/user');
const { decode } = require('../../common/utils/crypto');
const mongoose = require("mongoose");

const { createToken } = require('../../middleware/genrateTokens');
// const onBoardUser =require("./userService");
const jwt = require('jsonwebtoken');
const eventService = require("../event/eventService");

const ROLES = constants.ROLES;

const handleFileUploads = async (files) => {
  const results = {
    profileImage: null,
    teacherIdCard: null
  };

  if (!files) return results;

  try {
    //console.log('Processing files for upload:', {
    //   hasProfileImage: !!files.profileImage?.[0],
    //   hasTeacherIdCard: !!files.teacherIdCard?.[0]
    // });

    // Validate files before upload
    const validateFile = (file) => {
      if (!file || !file.buffer) {
        throw new appError(httpStatus.BAD_REQUEST, 'Invalid file data');
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB
        throw new appError(httpStatus.BAD_REQUEST, 'File size must be less than 10MB');
      }

      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.mimetype)) {
        throw new appError(httpStatus.BAD_REQUEST, 'Only JPG and PNG files are allowed');
      }
    };

    // Prepare files array for upload
    const filesToUpload = [];
    if (files.profileImage?.[0]) {
      validateFile(files.profileImage[0]);
      filesToUpload.push(files.profileImage[0]);
    }
    if (files.teacherIdCard?.[0]) {
      validateFile(files.teacherIdCard[0]);
      filesToUpload.push(files.teacherIdCard[0]);
    }

    if (filesToUpload.length === 0) {
      //console.log('No files to upload');
      return results;
    }

    // Upload files to Firebase
    const uploadedFiles = await uploadFilesToBucket(filesToUpload);
    //console.log('Uploaded files:', uploadedFiles);

    // Map uploaded files back to results
    uploadedFiles.forEach(file => {
      if (file.fieldname === 'profileImage') {
        results.profileImage = file.url;
      } else if (file.fieldname === 'teacherIdCard') {
        results.teacherIdCard = file.url;
      }
    });

    // Validate upload results
    if (files.profileImage?.[0] && !results.profileImage) {
      throw new appError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to upload profile image');
    }
    if (files.teacherIdCard?.[0] && !results.teacherIdCard) {
      throw new appError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to upload teacher ID card');
    }

    return results;
  } catch (error) {
    console.error('Error in handleFileUploads:', error);
    
    // Clean up any successful uploads if there was an error
    try {
      if (results.profileImage) {
        await deleteFileFromUrl(results.profileImage);
      }
      if (results.teacherIdCard) {
        await deleteFileFromUrl(results.teacherIdCard);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up files:', cleanupError);
    }

    throw error;
  }
};

// Self delete account for the authenticated user
const deleteSelfController = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return createResponse(res, httpStatus.UNAUTHORIZED, 'Unauthorized');
    }
    const deleted = await userService.deleteSelfById(req.user.id);
    return createResponse(res, httpStatus.OK, 'Account deleted successfully', {
      id: deleted._id,
    });
  } catch (error) {
    return createResponse(
      res,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to delete account'
    );
  }
};

// Helper function to delete file from Firebase using URL
async function deleteFileFromUrl(url) {
  try {
    const decodedUrl = decodeURIComponent(url);
    const filename = decodedUrl.split('/').pop();
    const fileRef = bucket.file(filename);
    await fileRef.delete();
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}


const userLoginController = async (request, response) => {
  try {
    //console.log("Login request body:", request.body);
    
    const data = await userService.userLoginService(request);
    //console.log("Data from userLoginService:", data);

    if (!data) {
      throw new appError(
        httpStatus.CONFLICT,
        "Unable to send OTP"
      );
    }

    return createResponse(
      response,
      httpStatus.OK,
      "OTP sent successfully",
      data
    );
  } catch (error) {
    console.error("Error in userLoginController:", error);
    return createResponse(
      response,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to send OTP"
    );
  }
};


const updateLocationController = async (req, res) => {
  try {
    const updatedUser = await userService.updateLocation(req);
    return createResponse(res, httpStatus.OK, "Location updated", updatedUser);
  } catch (error) {
    return createResponse(
      res,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Location update failed"
    );
  }
};



const searchTeachersController = async (req, res) => {
  try {
    const { userName } = req.query;
    //console.log('Searching for teachers with query:', userName);

    const query = {
      role: constants.ROLES.TEACHER,
      isOnboarded: true
    };

    if (userName) {
      query.$or = [
        { userName: { $regex: userName, $options: 'i' } },
        { name: { $regex: userName, $options: 'i' } }
      ];
    }

    const teachers = await User.find(query)
      .select('_id userName email teacherId name profileImage')
      .limit(20)
      .lean()
      .then(docs => docs.map(doc => ({
        ...doc,
        id: doc._id,
        _id: undefined
      })));

    return createResponse(
      res,
      httpStatus.OK,
      "Teachers found successfully",
      { data: teachers }
    );
  } catch (error) {
    console.error('Search teachers error:', error);
    return createResponse(
      res,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to search teachers"
    );
  }
};



const onBoardUserController = async (req, res) => {
  try {


    if (!req.user || !req.user.id) {
      return createResponse(
        res,
        httpStatus.UNAUTHORIZED,
        'Authentication required'
      );
    }
    // Upload files (if any) and attach URLs to request for service layer
    try {
      const uploaded = await handleFileUploads(req.files);
      req.uploadedFiles = uploaded; // { profileImage, teacherIdCard }
    } catch (uploadErr) {
      return createResponse(
        res,
        uploadErr.status || httpStatus.UNPROCESSABLE_ENTITY,
        uploadErr.message || 'File upload failed'
      );
    }

    const updatedUser = await userService.onBoardUser(req);
    //console.log('onBoardUserController - Updated user:', updatedUser);

    if (!updatedUser) {
      return createResponse(
        res,
        httpStatus.BAD_REQUEST,
        'Failed to update user'
      );
    }

    // Transform user data for response
    const userData = {
      id: updatedUser._id.toString(),
      mobileNo: updatedUser.mobileNo || '',
      countryCode: updatedUser.countryCode || '+91',
      deviceTokens: Array.isArray(updatedUser.deviceTokens) ? updatedUser.deviceTokens : [],
      isOnboarded: Boolean(updatedUser.isOnboarded),
      role: updatedUser.role?.toLowerCase() || 'user',
      createdAt: updatedUser.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: updatedUser.updatedAt?.toISOString() || new Date().toISOString(),
      email: updatedUser.email || '',
      name: updatedUser.name || '',
      profileImage: updatedUser.profileImage || '',
      teacherRoleApproved: updatedUser.teacherRoleApproved?.toLowerCase() || 'pending',
      userName: updatedUser.userName || '',
      teacherId: updatedUser.teacherId || '',
      teacherIdCard: updatedUser.teacherIdCard || ''
    };

    return createResponse(
      res,
      httpStatus.OK,
      'User onboarded successfully',
      userData
    );
  } catch (error) {
    console.error('onBoardUserController Error:', error);
    return createResponse(
      res,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message || 'Onboarding failed'
    );
  }
};

const addFiles = async (req, res) => {
  try {
    const files = await handleFileUploads(req.files);
    return createResponse(res, httpStatus.OK, "Files uploaded successfully", files);
  } catch (error) {
    return createResponse(
      res,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "File upload failed"
    );
  }
};

const addTeacherRole = async (req, res) => {
  try {
    // Implement teacher role addition logic
    return createResponse(res, httpStatus.OK, "Teacher role added");
  } catch (error) {
    return createResponse(
      res,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to add teacher role"
    );
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    return createResponse(res, httpStatus.OK, "Users retrieved", users);
  } catch (error) {
    return createResponse(
      res,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to get users"
    );
  }
};

const getAllTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: ROLES.TEACHER }).select('-password');
    return createResponse(res, httpStatus.OK, "Teachers retrieved", teachers);
  } catch (error) {
    return createResponse(
      res,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to get teachers"
    );
  }
};

const actionOnTeacherAccount = async (req, res) => {
  try {
    const { teacherId, action } = req.body;
    
    if (!teacherId || !action) {
      throw new appError(httpStatus.BAD_REQUEST, 'Teacher ID and action are required');
    }

    if (!['approve', 'suspend'].includes(action)) {
      throw new appError(httpStatus.BAD_REQUEST, 'Invalid action. Must be either approve or suspend');
    }

    const status = action === 'approve' ? constants.STATUS.ACCEPTED : constants.STATUS.REJECTED;
    const result = await userService.actionOnTeacherAccount({ 
      teacherId, 
      status,
      adminId: req.user._id // Add admin ID who performed the action
    });

    return createResponse(
      res,
      httpStatus.OK,
      `Teacher ${action === 'approve' ? 'approved' : 'suspended'} successfully`,
      result
    );
  } catch (error) {
    console.error('Error in actionOnTeacherAccount:', error);
    return createResponse(
      res,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message || `Failed to ${req.body.action} teacher`
    );
  }
};

const verifyOtpController = async (request, response) => {
  try {
    //console.log('Starting OTP verification process');
    //console.log('Request body:', {
    //   otp: request.body.otp,
    //   deviceToken: request.body.deviceToken,
    //   dataLength: request.body.data?.length
    // });

    // Call the service function to verify OTP
    const result = await userService.verifyOtp(request);
    
    if (!result || !result.user) {
      throw new appError(httpStatus.INTERNAL_SERVER_ERROR, "Invalid verification result");
    }

    // Safely access user properties with null checks and defaults
    const user = result.user;
    const userId = user._id ? user._id.toString() : null;

    if (!userId) {
      throw new appError(httpStatus.INTERNAL_SERVER_ERROR, "Invalid user ID");
    }

    // Prepare the response with null checks and default values
    const responseData = {
      success: true,
      message: "User logged in successfully",
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        accessTokenExpiresAt: result.accessExpiration,
        refreshTokenExpiresAt: result.refreshExpiration,
        user: {
          id: userId,
          mobileNo: user.mobileNo || '',
          role: user.role || 'user',
          isOnboarded: !!user.isOnboarded,
          countryCode: user.countryCode || '+91',
          deviceTokens: Array.isArray(user.deviceTokens) ? user.deviceTokens : [],
          teacherRoleApproved: user.teacherRoleApproved || 'pending',
          nearByVisible: !!user.nearByVisible,
          locationSharing: !!user.locationSharing
        },
        isNewUser: !!result.isNewUser
      }
    };

    //console.log('Response prepared:', {
    //   userId: responseData.data.user.id,
    //   hasAccessToken: !!responseData.data.accessToken,
    //   hasRefreshToken: !!responseData.data.refreshToken
    // });

    return response.status(httpStatus.OK).json(responseData);

  } catch (error) {
    console.error("OTP Verification Error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    });

    const errorResponse = {
      success: false,
      message: error.message || "Unable to login",
      data: null
    };

    const statusCode = error.status || httpStatus.INTERNAL_SERVER_ERROR;
    return response.status(statusCode).json(errorResponse);
  }
};

const getTeachersRequest = async (req, res) => {
  try {
    const requests = await User.find({ 
      role: ROLES.TEACHER, 
      teacherRoleApproved: 'pending'
    }).select('-password');
    return createResponse(res, httpStatus.OK, "Teacher requests retrieved", requests);
  } catch (error) {
    console.error('Error in getTeachersRequest:', error);
    return createResponse(
      res,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to get teacher requests"
    );
  }
};

const updateSocialMediaLinks = async (request, response) => {
  try {
    const data = await userService.updateSocialMediaLinks(request);
    if (!data) {
      throw new appError(httpStatus.CONFLICT);
    }
    //console.log("data-----------", data);
    return createResponse(
      response,
      httpStatus.OK,
      "social media updated",
      data
    );
  } catch (error) {
    //console.log("error-----------", error);
    createResponse(response, error.status, error.message);
  }
};
const generateTokenController = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return createResponse(res, httpStatus.BAD_REQUEST, "Refresh token required");
    }
    const newToken = await createToken(refreshToken);
    return createResponse(res, httpStatus.OK, "Token refreshed", { token: newToken });
  } catch (error) {
    return createResponse(
      res,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Token refresh failed"
    );
  }
};

const locationSharing = async (request, response) => {
  try {
    const data = await userService.locationSharing(request);
    if (!data) {
      throw new appError(httpStatus.CONFLICT);
    }
    //console.log("data-----------", data);
    return createResponse(response, httpStatus.OK, "location sharing", data);
  } catch (error) {
    //console.log("error-----------", error);
    createResponse(response, error.status, error.message);
  }
};

// controllers/userController.js
const getNearbyVisible = async (req, res) => {
  try {
    console.log('[getNearbyVisible] Headers:', req.headers);
    console.log('[getNearbyVisible] Authorization header:', req.headers['authorization']);
    console.log('[getNearbyVisible] req.user:', req.user);
    console.log('[getNearbyVisible] Request body:', req.body);
    if (!req.user || !req.user.id) {
      console.log('[getNearbyVisible] Unauthorized: user not authenticated');
      res.status(401).json({ message: 'Unauthorized: user not authenticated' });
      console.log('[getNearbyVisible] Response: 401 Unauthorized');
      return;
    }
    const { longitude, latitude, location } = req.body;
    // Update location if provided
    if (longitude && latitude) {
      await userService.updateLocation({
        user: req.user,
        body: { lat: latitude, long: longitude, location }
      });
    }
    // Fetch nearby teachers (no radius restriction)
    const nearByTeachers = await userService.getAllUsersService(longitude, latitude);
    
    const responseBody = {
      message: nearByTeachers && nearByTeachers.length > 0 ? "Here are teachers" : "No teachers found",
      nearByUsers: nearByTeachers, // Keep the same field name for frontend compatibility
    };
    console.log('[getNearbyVisible] Response: 200 OK', responseBody);
    return res.status(200).json(responseBody);
  
  } catch (error) {
    return res.status(400).json({
      message: `Error finding teachers: ${error.message}`,
    });
  }
};

const getSocialMediaController = async (request, response) => {
  try {
    const data = await userService.getSocialMedia(request);
    return createResponse(response, httpStatus.OK, "Social media links retrieved successfully", data);
  } catch (error) {
    //console.log("error-----------", error);
    createResponse(response, error.status || httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to fetch social media");
  }
};


const searchUsers = async (req, res) => {
  try {
    const { userName, latitude, longitude } = req.query;
    
    // Search teachers and admins by userName (not by name)
    const query = {
      $or: [
        {
          role: ROLES.TEACHER,
          teacherRoleApproved: 'accepted' // Only approved teachers
        },
        {
          role: ROLES.ADMIN // Include all admin users
        }
      ],
      locationSharing: true, // Only users with location sharing enabled
      ...(userName?.trim() 
        ? { userName: { $regex: userName, $options: 'i' } }
        : {}) // If no userName provided, return all teachers and admins
    };
    
    let users = await User.find(query)
      .select('name userName profileImage youtubeUrl xUrl instagramUrl geometry locationSharing role teacherRoleApproved')
      .sort({ createdAt: -1 }) // Sort by most recent
      .limit(20);
    
    // Calculate distance if current user location is provided
    if (latitude && longitude) {
      users = users.map(user => {
        let distance = null;
        let userLat = null;
        let userLng = null;
        
        // Extract user coordinates if available
        if (user.geometry && user.geometry.coordinates && user.geometry.coordinates.length === 2) {
          userLng = user.geometry.coordinates[0];
          userLat = user.geometry.coordinates[1];
          
          console.log(`DEBUG: User ${user.userName} coordinates: lat=${userLat}, lng=${userLng}`);
          console.log(`DEBUG: Current location: lat=${latitude}, lng=${longitude}`);
          
          // Calculate distance using Haversine formula
          distance = calculateDistance(
            parseFloat(latitude), 
            parseFloat(longitude), 
            userLat, 
            userLng
          );
          
          console.log(`DEBUG: Calculated distance for ${user.userName}: ${distance}, type: ${typeof distance}`);
        }
        
        return {
          ...user.toObject(),
          distance: (typeof distance === 'number' && !isNaN(distance)) ? `${distance.toFixed(1)} km` : 'Unknown',
          latitude: userLat,
          longitude: userLng
        };
      });
      
      // Sort by distance if available
      users.sort((a, b) => {
        if (a.distance === 'Unknown' && b.distance === 'Unknown') return 0;
        if (a.distance === 'Unknown') return 1;
        if (b.distance === 'Unknown') return -1;
        return parseFloat(a.distance) - parseFloat(b.distance);
      });
    }
    
    return createResponse(
      res, 
      httpStatus.OK, 
      users.length ? "Users found" : "No users found", 
      { data: users }
    );
  } catch (error) {
    console.error("Search users error:", error);
    return createResponse(
      res, 
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Error searching users"
    );
  }
};

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in kilometers
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

async function getUser(request, response) {
  try {
    console.log("\x1b[35m[API:getUser] Request received\x1b[0m");

    if (!request.user || !request.user.id) {
      console.log("\x1b[35m[API:getUser] ❌ No user in request\x1b[0m");
      return createResponse(
        response,
        httpStatus.UNAUTHORIZED,
        "User not authenticated"
      );
    }

    console.log(`\x1b[35m[API:getUser] Fetching user with ID: ${request.user.id}\x1b[0m`);
    const user = await User.findById(request.user.id)
      .select('-refreshTokens -password')
      .lean();

    if (!user) {
      console.log(`\x1b[35m[API:getUser] ❌ User not found in DB for ID: ${request.user.id}\x1b[0m`);
      throw new appError(httpStatus.NOT_FOUND, "User not found");
    }

    console.log(`\x1b[35m[API:getUser] ✅ User found: ${user._id}\x1b[0m`);

    const data = {
      _id: user._id.toString(),
      id: user._id.toString(),
      mobileNo: user.mobileNo || '',
      countryCode: user.countryCode || '',
      deviceTokens: Array.isArray(user.deviceTokens) ? user.deviceTokens : [],
      isOnboarded: Boolean(user.isOnboarded),
      createdAt: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: user.updatedAt ? user.updatedAt.toISOString() : new Date().toISOString(),
      role: user.role || 'user',
      email: user.email || '',
      name: user.name || '',
      profileImage: user.profileImage || '',
      teacherRoleApproved: user.teacherRoleApproved || 'pending',
      userName: user.userName || '',
      teacherId: user.teacherId || '',
      teacherIdCard: user.teacherIdCard || '',
      bio: user.bio || '',
      youtubeUrl: user.youtubeUrl || '',
      xUrl: user.xUrl || '',
      instagramUrl: user.instagramUrl || '',
      nearByVisible: Boolean(user.nearByVisible),
      locationSharing: Boolean(user.locationSharing),
      geometry: user.geometry || { type: 'Point', coordinates: [0, 0] }
    };

    console.log("\x1b[35m[API:getUser] 🚀 Sending transformed user data\x1b[0m");
    return createResponse(response, httpStatus.OK, "User found", data);
  } catch (error) {
    console.error("\x1b[35m[API:getUser] 💥 Error:\x1b[0m", error);
    return createResponse(
      response,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to retrieve user profile"
    );
  }
}

const createAddressController = async (req, res) => {
  try {
    // Validate user authentication
    if (!req.user || !req.user.id) {
      return createResponse(res, httpStatus.UNAUTHORIZED, 'Authentication required');
    }

    // Add user ID to request body
    req.body.userId = req.user.id;

    // Call service to create address
    const result = await userService.createAddressService(req);

    return createResponse(
      res,
      httpStatus.CREATED,
      'Address created successfully',
      result
    );
  } catch (error) {
    console.error('Create address controller error:', error);
    return createResponse(
      res,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to create address'
    );
  }
};

const createEventController = async (req, res) => {
  try {
    const event = await userService.createEventService(req);
    return createResponse(res, httpStatus.CREATED, 'Event created successfully', event);
  } catch (error) {
    return createResponse(res, error.status || httpStatus.INTERNAL_SERVER_ERROR, error.message || 'Failed to create event');
  }
};

const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) {
      return createResponse(res, httpStatus.BAD_REQUEST, 'FCM token is required');
    }
    
    const userId = req.user.id;
    if (!userId) {
      return createResponse(res, httpStatus.UNAUTHORIZED, 'User not authenticated');
    }

    const user = await userService.updateFcmToken(userId, fcmToken);
    return createResponse(res, httpStatus.OK, 'FCM token updated successfully', {
      id: user._id,
      fcmToken: user.fcmToken
    });
  } catch (error) {
    console.error('Error updating FCM token:', error);
    return createResponse(
      res, 
      error.status || httpStatus.INTERNAL_SERVER_ERROR, 
      error.message || 'Failed to update FCM token'
    );
  }
};

// Controller to get nearby events for map
const getNearbyEvents = async (req, res) => {
  try {
    const { longitude, latitude, radius } = req.body;
    let nearbyEvents;
    if (longitude && latitude && radius) {
      nearbyEvents = await eventService.getNearbyEventsService(longitude, latitude, radius);
    } else {
      nearbyEvents = await eventService.getNearbyEventsService();
    }
    if (!nearbyEvents || nearbyEvents.length === 0) {
      return res.status(200).json({
        message: "No events found",
      });
    }
    return res.status(200).json({
      message: "Here are events",
      nearbyEvents,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error finding events: ${error.message}`,
    });
  }
};

// Soft delete user controller (admin only via route middleware)
const deleteUserController = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return createResponse(res, httpStatus.BAD_REQUEST, 'UserId is required');
    }

    // Extra safety: prevent self-deletion even if somehow reaches here
    if (req.user && req.user.id && req.user.id.toString() === userId.toString()) {
      return createResponse(res, httpStatus.BAD_REQUEST, 'Admins cannot delete their own account');
    }

    const deleted = await userService.deleteUserById(req.user?.id, userId);
    return createResponse(res, httpStatus.OK, 'User deleted successfully', {
      id: deleted._id,
    });
  } catch (error) {
    return createResponse(
      res,
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to delete user'
    );
  }
};

module.exports = {
  userLoginController,
  updateLocationController,
  searchTeachersController,
  onBoardUserController,
  addFiles,
  addTeacherRole,
  getAllUsers,
  getAllTeachers,
  actionOnTeacherAccount,
  verifyOtpController,
  getTeachersRequest,
  updateSocialMediaLinks,
  generateTokenController,
  locationSharing,
  getNearbyVisible,
  getNearbyEvents,
  getSocialMediaController,
  searchUsers,
  getUser,
  createAddressController,
  createEventController,
  updateFcmToken,
  deleteUserController,
  deleteSelfController,
};