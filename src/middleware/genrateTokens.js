// utils/tokenService.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const createResponse = require('../common/utils/createResponse');
const httpStatus = require('../common/utils/status.json');
const moment = require('moment');

// Environment variables for token expiration and secret
const JWT_ACCESS_EXPIRATION_MINUTES = 3 * 30 * 24 * 60; // 3 months in minutes
const JWT_REFRESH_EXPIRATION_DAYS = 7;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('JWT_SECRET environment variable is not set!');
  process.exit(1);
}

const createToken = async (userId) => {
  try {
    //console.log('Creating tokens for user:', userId);

    // Generate access token
    const accessToken = jwt.sign(
      { id: userId, type: 'access' },
      process.env.JWT_SECRET,
      { expiresIn: '90d' } // 90 days equals roughly 3 months
    );
    
    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: userId, type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: `${process.env.JWT_REFRESH_EXPIRATION_DAYS}d` }
    );

    // Calculate expiration times
    const accessExpiration = moment()
      .add(3, 'months')
      .toISOString();
    const refreshExpiration = moment()
      .add(process.env.JWT_REFRESH_EXPIRATION_DAYS, 'days')
      .toDate();

    // Update user's refresh tokens
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found:', userId);
      throw new Error('User not found');
    }

    // Migrate existing tokens if needed
    await migrateTokens(user);

    // Create new token object
    const newTokenObj = {
      token: refreshToken,
      expiresAt: refreshExpiration
    };

    // Add new token while maintaining limit of 5
    const existingTokenIndex = user.refreshTokens.findIndex(t => t.token === refreshToken);
    if (existingTokenIndex === -1) {
      user.refreshTokens = [
        newTokenObj,
        ...user.refreshTokens.slice(0, 4)
      ];
    }

    // Remove expired tokens
    user.refreshTokens = user.refreshTokens.filter(t => 
      moment(t.expiresAt).isAfter(moment())
    );

    // Save user with new tokens
    try {
      await user.save();
      //console.log('User tokens updated successfully:', {
      //   userId,
      //   tokenCount: user.refreshTokens.length
      // });
    } catch (saveError) {
      console.error('Error saving user tokens:', saveError);
      throw new Error('Failed to save user tokens');
    }

    return {
      accessToken,
      refreshToken,
      accessExpiration,
      refreshExpiration: refreshExpiration.toISOString()
    };
  } catch (error) {
    console.error('Token creation error:', error);
    throw error;
  }
};

const migrateTokens = async (user) => {
  try {
    // If refreshTokens is not an array, initialize it
    if (!Array.isArray(user.refreshTokens)) {
      user.refreshTokens = [];
      return;
    }

    // Convert any string tokens to proper objects
    const migratedTokens = user.refreshTokens.map(token => {
      // If it's already a proper object with required fields, keep it
      if (token && typeof token === 'object' && token.token && token.expiresAt) {
        return token;
      }

      // If it's a string token, convert it to object format
      if (typeof token === 'string') {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          return {
            token: token,
            expiresAt: new Date(decoded.exp * 1000)
          };
        } catch (e) {
          // If token is invalid, skip it
          return null;
        }
      }

      // If it's an object but missing required fields
      if (token && typeof token === 'object' && token.token) {
        return {
          token: token.token,
          expiresAt: token.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        };
      }

      return null;
    });

    // Filter out null values and limit to 5 most recent tokens
    user.refreshTokens = migratedTokens
      .filter(t => t !== null)
      .slice(0, 5);

  } catch (error) {
    console.error('Token migration error:', error);
    // Reset tokens array if migration fails
    user.refreshTokens = [];
  }
};

const generateToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return createResponse(res, httpStatus.UNAUTHORIZED, "Refresh token is required");
    }

    // Verify the refresh token
    let decoded;
    try {
      decoded = await new Promise((resolve, reject) => {
        jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
          if (err) {
            console.error("Refresh token verification error:", err);
            reject(err);
          }
          resolve(decoded);
        });
      });
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return createResponse(res, httpStatus.UNAUTHORIZED, "Invalid refresh token");
    }

    // Find user and validate token
    const user = await User.findById(decoded.id);
    if (!user) {
      console.error("User not found for token:", decoded.id);
      return createResponse(res, httpStatus.UNAUTHORIZED, "Invalid refresh token");
    }

    // Validate that the token exists and hasn't expired
    const tokenExists = user.refreshTokens.find(t => 
      t.token === refreshToken && moment(t.expiresAt).isAfter(moment())
    );

    if (!tokenExists) {
      console.error("Token not found or expired in user's refresh tokens");
      return createResponse(res, httpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
    }

    // Remove used refresh token
    user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
    await user.save();

    // Generate new tokens
    const tokens = await createToken(user._id.toString());

    return createResponse(res, httpStatus.OK, "New tokens generated successfully", {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresAt: tokens.accessExpiration,
      refreshTokenExpiresAt: tokens.refreshExpiration
    });
  } catch (error) {
    console.error("Error in generateToken:", error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return createResponse(res, httpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
    }
    return createResponse(res, httpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
  }
};

const generateResetPasswordToken = async (user) => {
  const resetToken = jwt.sign(
    { id: user._id, type: 'reset' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  return resetToken;
};

const verifyResetPasswordToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired reset token');
  }
};

module.exports = {
  createToken,
  generateToken,
  generateResetPasswordToken,
  verifyResetPasswordToken,
  migrateTokens
};