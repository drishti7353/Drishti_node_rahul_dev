const jwt = require('jsonwebtoken');
const config = require('../config/config');

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const decoded = jwt.verify(refreshToken, config.refreshTokenSecret);
    const accessToken = jwt.sign({ userId: decoded.userId }, config.jwtSecret, {
      expiresIn: '1h'
    });

    res.json({
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

module.exports = {
  refreshToken
};
