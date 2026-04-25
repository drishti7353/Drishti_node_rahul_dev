const jwt = require('jsonwebtoken');
const appError = require('../common/utils/appError');
const httpStatus = require('../common/utils/status.json');
const config = require('../config/config');
const User = require('../models/user');

const verifyToken = (req, res, next) => {
  try {
    // Get token from request header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new appError(httpStatus.UNAUTHORIZED, 'No token provided'));
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    jwt.verify(token, config.jwtSecret, (err, decoded) => {
      if (err) {
        return next(new appError(httpStatus.UNAUTHORIZED, 'Invalid token'));
      }
      
      // Add user info to the request object
      req.user = {
        id: decoded.userId,
        email: decoded.email,
      };
      
      next();
    });
  } catch (error) {
    return next(new appError(httpStatus.INTERNAL_SERVER_ERROR, error.message));
  }
};

module.exports = {
  verifyToken
};
