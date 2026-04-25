const createResponse = (
  response,
  status = 500,
  message = "Internal Server error",
  payload = null
) => {
  if (!response || !response.status) {
    console.error('Invalid response object provided to createResponse');
    return;
  }
  
  // Defensive: convert Mongoose docs or arrays to plain objects
  let safePayload = payload;
  if (payload) {
    if (typeof payload.toObject === 'function') {
      safePayload = payload.toObject();
    } else if (typeof payload.toJSON === 'function') {
      safePayload = payload.toJSON();
    } else if (Array.isArray(payload)) {
      safePayload = payload.map(item => {
        if (item && typeof item.toObject === 'function') return item.toObject();
        if (item && typeof item.toJSON === 'function') return item.toJSON();
        return item;
      });
    }
  }

  try {
    return response.status(status).json({
      success: status >= 200 && status < 300,
      message: message,
      data: safePayload,
    });
  } catch (err) {
    console.error('Error in createResponse:', err);
    return response.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null
    });
  }
};

module.exports = createResponse;
