const loginOtp = (otp) => {
  return (
    `Dear User,\n` +
    `${otp} is your otp for Drishti. Please enter the OTP to verify your phone number.\n` +
    `Team\n` +
    `Drishti`
  );
};

module.exports = loginOtp;
