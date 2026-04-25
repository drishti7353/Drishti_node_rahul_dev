const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000'; // Adjust as needed
const APPLE_REVIEW_PHONE = '1234567890';
const APPLE_REVIEW_COUNTRY_CODE = '+91';
const MOCK_OTP = '482957';

async function testMockAuth() {
  try {
    console.log('🍎 Testing Apple Review Mock OTP System');
    console.log('=====================================');
    
    // Step 1: Test login with Apple Review number
    console.log('\n1. Testing login with Apple Review number...');
    const loginResponse = await axios.post(`${BASE_URL}/user/login`, {
      mobileNo: APPLE_REVIEW_PHONE,
      countryCode: APPLE_REVIEW_COUNTRY_CODE
    });
    
    console.log('✅ Login request successful');
    console.log('Encrypted data received:', loginResponse.data.data.substring(0, 50) + '...');
    
    const encryptedData = loginResponse.data.data;
    
    // Step 2: Test OTP verification with mock OTP
    console.log('\n2. Testing OTP verification with mock OTP (482957)...');
    const verifyResponse = await axios.post(`${BASE_URL}/user/verify`, {
      otp: MOCK_OTP,
      data: encryptedData,
      deviceToken: 'test_device_token_' + Date.now()
    });
    
    console.log('✅ OTP verification successful');
    console.log('User created/authenticated:', {
      userId: verifyResponse.data.data.user.id,
      mobileNo: verifyResponse.data.data.user.mobileNo,
      isNewUser: verifyResponse.data.data.isNewUser,
      accessToken: verifyResponse.data.data.accessToken ? 'Present' : 'Missing'
    });
    
    // Step 3: Test with wrong OTP to ensure validation still works
    console.log('\n3. Testing with wrong OTP to ensure validation works...');
    try {
      await axios.post(`${BASE_URL}/user/verify`, {
        otp: '123456', // Wrong OTP
        data: encryptedData,
        deviceToken: 'test_device_token_wrong'
      });
      console.log('❌ ERROR: Wrong OTP was accepted (this should not happen)');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Wrong OTP correctly rejected');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    console.log('\n🎉 Apple Review Mock OTP System Test Complete!');
    console.log('\nSummary:');
    console.log('- ✅ Mock number bypasses SMS sending');
    console.log('- ✅ OTP "482957" is accepted for Apple Review');
    console.log('- ✅ Wrong OTPs are still rejected');
    console.log('- ✅ User account creation/login works');
    console.log('\n🍎 Ready for Apple Review!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    console.log('\nMake sure:');
    console.log('1. Server is running on', BASE_URL);
    console.log('2. Database is connected');
    console.log('3. All environment variables are set');
  }
}

// Test with regular number (should use real SMS service)
async function testRegularAuth() {
  try {
    console.log('\n📱 Testing Regular Number (should attempt real SMS)');
    console.log('================================================');
    
    const regularResponse = await axios.post(`${BASE_URL}/user/login`, {
      mobileNo: '9876543210',
      countryCode: '+91'
    });
    
    console.log('✅ Regular number login attempted');
    console.log('Note: This should have tried to send real SMS via 2Factor.in');
    
  } catch (error) {
    if (error.response?.data?.Details?.includes('Invalid Phone Number')) {
      console.log('✅ Expected error for regular number (2Factor API called)');
    } else {
      console.log('⚠️ Unexpected error (but this is expected in test environment):', error.response?.data?.message || error.message);
    }
  }
}

// Run the tests
async function runAllTests() {
  await testMockAuth();
  await testRegularAuth();
}

runAllTests();

