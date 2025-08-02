# 🚨 Sendbird API Setup Required!

## The Problem
Your conversation creation is failing because the Sendbird API credentials are not configured on Render.

## What's Happening
1. User clicks "Create Conversation"
2. Backend receives the request
3. Tries to sync users with Sendbird → **FAILS** (no API token)
4. Request hangs and never responds

## How to Fix

### Step 1: Get Your Sendbird Credentials
1. Go to [Sendbird Dashboard](https://dashboard.sendbird.com)
2. Select your application
3. Go to **Settings** → **Application** → **General**
4. Copy:
   - **App ID** (looks like: `XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`)
   - **Master API Token** (under "API tokens" section)

### Step 2: Add to Render Backend
1. Go to your [Render Dashboard](https://dashboard.render.com)
2. Click on `sendbird-messaging-api` service
3. Go to **Environment** tab
4. Add these environment variables:
   ```
   SENDBIRD_APP_ID = your-app-id-here
   SENDBIRD_API_TOKEN = your-master-api-token-here
   ```
5. Click **Save Changes**
6. Service will auto-restart

### Step 3: Add to Render Frontend
1. Go to your `sendbird-healthcare-frontend` static site
2. Go to **Environment** tab
3. Add:
   ```
   VITE_SENDBIRD_APP_ID = your-app-id-here
   ```
4. Click **Save Changes**
5. Manually redeploy the frontend

## Quick Test
After both services restart:
1. Login to your app
2. Go to Conversations
3. Try creating a conversation
4. Should work now! 🎉

## If Still Not Working
Check the API logs for error messages like:
- "401 Unauthorized" → API token is wrong
- "400 Bad Request" → App ID might be wrong
- Connection errors → Check if Sendbird service is up

## Important Notes
- Use the **Master API Token**, not a secondary token
- Make sure there are no extra spaces in the values
- Both frontend and backend need the App ID
- Only backend needs the API Token