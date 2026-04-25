# Deployment Instructions for OTP 301 Redirect Fix

## Current Status

- ✅ Code fix is implemented in `/src/modules/user/userService.js`
- ✅ Changes are committed to git (HEAD: dbf35b70)
- ⏳ Production server needs to be redeployed

## Deployment Steps

### Option 1: SSH Deployment (Direct Server Update)

```bash
# SSH into the production server
ssh -i drishti-key.pem ubuntu@13.232.3.232

# Navigate to the application directory
cd /path/to/drishti-app

# Pull the latest code
git pull origin main

# Install dependencies (if needed)
npm install

# Restart the application with PM2
pm2 restart drishti
pm2 save

# Verify the restart
pm2 logs drishti
```

### Option 2: AWS CodeDeploy (Automated)

If using AWS CodeDeploy with buildspec.yml:

1. Push changes to GitHub main branch
2. AWS CodeDeploy will automatically trigger
3. Application will be rebuilt and redeployed

### Option 3: Manual PM2 Restart

If the code is already on the server but PM2 hasn't reloaded:

```bash
ssh -i drishti-key.pem ubuntu@13.232.3.232
pm2 restart drishti --force
pm2 save
```

## Verification After Deployment

### Test OTP Request

```bash
curl -X POST https://collabdiary.in/v1/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "mobileNo": "8291541168",
    "countryCode": "+91",
    "type": "VERIFICATION"
  }'
```

**Expected Response:**

- Status: 200 OK
- Body: `{"success": true, "data": "<encrypted_session_data>"}`

**NOT Expected:**

- Status: 301 Redirect
- Location header pointing to same URL

### Monitor Server Logs

```bash
ssh -i drishti-key.pem ubuntu@13.232.3.232
pm2 logs drishti | grep -E "OTP|2Factor|redirect"
```

## Changes Made

### File: `/src/modules/user/userService.js`

**Function: `userLoginService()` (lines 46-102)**

- Added `maxRedirects: 0` to axios config
- Added explicit redirect detection (3xx status codes)
- Enhanced error handling with user-friendly messages

**Function: `verifyOtp()` (lines 250-302)**

- Applied same axios configuration
- Added explicit redirect detection during verification
- Consistent error handling approach

## Rollback Plan (If Needed)

```bash
git revert dbf35b70
git push origin main
# Redeploy using same method above
```

## Key Points

- The fix prevents infinite redirect loops by disabling auto-redirect following
- Server will now return clear error messages instead of 301 redirects
- No database migrations required
- No environment variable changes needed
- Backward compatible with existing clients
