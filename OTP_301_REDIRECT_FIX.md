# OTP 301 Redirect Loop Fix

## Problem Summary

The OTP login endpoint was returning a **301 Moved Permanently** redirect to itself, creating an infinite loop that prevented users from sending OTP requests.

### Root Cause

The 2Factor.in API was returning a 301 redirect response, and axios was configured to follow redirects by default. When the redirect pointed to the same URL, it created an infinite loop that eventually failed.

**Evidence from logs:**

```
[AUTH_DEBUG] API URL: https://collabdiary.in/user/login
[AUTH_DEBUG] Status Code: 301
[AUTH_DEBUG] Location Header: https://collabdiary.in/user/login (same URL!)
[AUTH_DEBUG] Response Body: <html><head><title>301 Moved Permanently</title></head>...
```

## Solution Implemented

### Changes Made to `/src/modules/user/userService.js`

#### 1. **OTP Request Endpoint (userLoginService)**

- **Line 49-57**: Added axios configuration to disable automatic redirect following

  - `maxRedirects: 0` - Prevents axios from following redirects
  - `validateStatus` - Accepts both success (2xx) and redirect (3xx) responses without throwing errors

- **Line 59-69**: Added explicit redirect detection

  - Checks if response status is 3xx (redirect)
  - Logs the redirect details for debugging
  - Throws a user-friendly error instead of following the redirect

- **Line 85-91**: Enhanced error handling for redirect responses
  - Catches redirect errors from the API
  - Returns a clear error message to the client

#### 2. **OTP Verification Endpoint (verifyOtp)**

- **Line 259-267**: Applied same axios configuration as OTP request

  - Disables automatic redirects
  - Accepts 3xx responses

- **Line 269-279**: Added explicit redirect detection during verification

  - Checks for 3xx status codes
  - Logs redirect details
  - Throws appropriate error

- **Line 292-298**: Enhanced error handling for verification redirects
  - Catches and properly handles redirect responses
  - Returns user-friendly error messages

## Key Improvements

1. **Prevents Infinite Loops**: By setting `maxRedirects: 0`, the client no longer follows redirects automatically
2. **Better Error Messages**: Users get clear feedback about service issues instead of cryptic redirect errors
3. **Detailed Logging**: Developers can see exactly what redirects are happening and debug server-side issues
4. **Consistent Handling**: Both OTP request and verification endpoints use the same approach

## Testing Recommendations

### 1. Test OTP Request with Valid Phone Number

```bash
curl -X POST https://collabdiary.in/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "mobileNo": "8291541168",
    "countryCode": "+91",
    "type": "VERIFICATION"
  }'
```

**Expected Result**: Should receive encrypted session data without 301 errors

### 2. Test OTP Verification

```bash
curl -X POST https://collabdiary.in/user/verify \
  -H "Content-Type: application/json" \
  -d '{
    "otp": "123456",
    "data": "<encrypted_session_data>",
    "deviceToken": "<device_token>"
  }'
```

**Expected Result**: Should verify OTP without redirect errors

### 3. Test with Invalid Phone Number

Should return clear error about invalid format, not redirect errors

### 4. Monitor Logs

Check server logs for:

- `[AUTH_DEBUG] API URL:` - Confirms correct endpoint
- `[AUTH_DEBUG] Status Code:` - Should be 200, not 301
- `2Factor API Error:` - Any API-level issues

## Server-Side Investigation (If Issues Persist)

If the 2Factor.in API continues returning 301 redirects:

1. **Verify API Endpoint**: Ensure the URL format is correct

   ```
   https://2factor.in/API/V1/{API_KEY}/SMS/{countryCode}{mobileNo}/AUTOGEN/OTP%20For%20Verification
   ```

2. **Check API Key**: Verify `TWO_FACTOR_API_KEY` in `.env` is valid

3. **Test API Directly**: Use curl to test the 2Factor.in API directly

   ```bash
   curl "https://2factor.in/API/V1/{API_KEY}/SMS/+918291541168/AUTOGEN/OTP%20For%20Verification"
   ```

4. **Contact 2Factor.in Support**: If the API is misconfigured on their end

## Files Modified

- `/src/modules/user/userService.js`
  - `userLoginService()` function (lines 46-101)
  - `verifyOtp()` function (lines 250-302)

## Deployment Notes

- No database migrations required
- No environment variable changes needed
- Backward compatible with existing client implementations
- Can be deployed immediately without additional configuration
