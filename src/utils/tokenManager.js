const jwt = require('jsonwebtoken');
const moment = require('moment');

class TokenManager {
  // EDIT: Added token type validation
  static validateAccessToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Access token expired');
      }
      throw new Error('Invalid token');
    }
  }

  // EDIT: Improved token generation with explicit types
  static generateTokens(userId) {
    const accessToken = jwt.sign(
      { 
        userId, 
        type: 'access',
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRATION_MINUTES + 'm' }
    );
    
    const refreshToken = jwt.sign(
      { 
        userId, 
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRATION_DAYS + 'd' }
    );

    // EDIT: Added more precise expiration tracking
    const accessTokenExpiry = moment().add(
      parseInt(process.env.JWT_ACCESS_EXPIRATION_MINUTES), 
      'minutes'
    );
    const refreshTokenExpiry = moment().add(
      parseInt(process.env.JWT_REFRESH_EXPIRATION_DAYS), 
      'days'
    );

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: accessTokenExpiry.toISOString(),
      refreshTokenExpiresAt: refreshTokenExpiry.toISOString()
    };
  }

  // EDIT: Enhanced refresh token validation
  static validateRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      // EDIT: Added explicit expiration check
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
        throw new Error('Refresh token expired');
      }
      
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired');
      }
      throw new Error('Invalid refresh token');
    }
  }
}

module.exports = TokenManager;
