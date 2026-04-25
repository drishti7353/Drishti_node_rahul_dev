const jwt = require("jsonwebtoken");
const constants = require("../common/utils/constants.js");
const createResponse = require("../common/utils/createResponse.js");
const status = require("../common/utils/status.json");
const User = require("../models/user");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('JWT_SECRET environment variable is not set!');
  process.exit(1);
}

const verifyJWT = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (error, decoded) => {
      if (error) {
        console.error('JWT verification error:', error.message);
        reject(error);
      }
      resolve(decoded);
    });
  });
};

const auth = (user_Role) => async (request, response, next) => {
  try {
    //console.log('Auth middleware - Received headers:', request.headers);
    // Flatten the roles array to handle nested arrays
    const userRoles = Array.isArray(user_Role) 
      ? user_Role.flat() 
      : [user_Role];
    
    const authHeader = request.header("Authorization");
    
    //console.log('Auth middleware - Authorization header:', authHeader);
    
    // Handle guest role
    if (!authHeader && userRoles.includes(constants.ROLES.GUEST)) {
      return next();
    }

    if (!authHeader) {
      //console.log('Auth middleware - No authorization header provided');
      return createResponse(
        response,
        status.UNAUTHORIZED,
        "Please provide an authorization token"
      );
    }

    // Extract token from Bearer format
    const token = authHeader.startsWith("Bearer ") 
      ? authHeader.slice(7) 
      : authHeader;
    
    //console.log('Auth middleware - Extracted token:', token);

    try {
      const verified = await verifyJWT(token);
      //console.log('Auth middleware - Verified token payload:', verified);
      
      if (!verified || !verified.id) {
        throw new Error('Invalid token payload');
      }

      // Find and validate user
      const user = await User.findById(verified.id);
      //console.log('Auth middleware - Found user:', user ? user._id : 'No user found');

      if (!user) {
        return createResponse(
          response,
          status.UNAUTHORIZED,
          "User not found"
        );
      }

      // Check if user has required role
      if (!userRoles.includes(user.role)) {
        return createResponse(
          response,
          status.FORBIDDEN,
          "You don't have permission to access this resource"
        );
      }

      // Attach user to request
      request.user = {
        id: user._id.toString(),
        role: user.role
      };

      next();
    } catch (error) {
      console.error('Auth middleware - Token verification error:', error.message);
      return createResponse(
        response,
        status.UNAUTHORIZED,
        error.message === 'jwt expired' 
          ? "Token has expired" 
          : "Invalid token"
      );
    }
  } catch (error) {
    console.error('Auth middleware - General error:', error);
    return createResponse(
      response,
      status.INTERNAL_SERVER_ERROR,
      "Authentication failed"
    );
  }
};

module.exports = auth;