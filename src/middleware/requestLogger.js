const requestLogger = (req, res, next) => {
  //console.log('===== REQUEST DETAILS =====');
  //console.log(`Method: ${req.method}, Path: ${req.path}`);
  
  // Pretty print the body for better debugging
  if (req.body) {
    //console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  
  //console.log('Params:', req.params);
  //console.log('Query:', req.query);
  //console.log('Headers:', JSON.stringify(req.headers, null, 2));
  //console.log('==========================');
  
  // Log the response as well
  const oldSend = res.send;
  res.send = function(data) {
    //console.log('===== RESPONSE DETAILS =====');
    //console.log('Status:', res.statusCode);
    try {
      const parsedData = JSON.parse(data);
      //console.log('Body:', JSON.stringify(parsedData, null, 2));
    } catch (e) {
      //console.log('Body:', data);
    }
    //console.log('============================');
    return oldSend.apply(res, arguments);
  };
  
  next();
};

module.exports = requestLogger;
