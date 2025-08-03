# Sendbird User Fix Guide

## The Problem
Sendbird was returning "User not found" because it was trying to UPDATE users that didn't exist yet. The API was using PUT instead of POST for new users.

## The Fix
1. Changed `createOrUpdateUser` to try POST first (create), then PUT (update)
2. Added a sync script to ensure all users exist in Sendbird

## Manual Fix (While Waiting for Deploy)

### Option 1: Use Render Shell
1. Go to your Render dashboard
2. Click on the backend service
3. Go to "Shell" tab
4. Run:
```bash
cd /opt/render/project/src
npm run sync:sendbird-users
```

### Option 2: Wait for Auto-Deploy
The fix will automatically:
1. Deploy in ~5 minutes
2. Run the sync script during build
3. Create all missing Sendbird users

## After Fix is Applied
Conversations will work normally:
1. Click "New Conversation"
2. Enter title
3. Select patient
4. Click "Create"
5. You'll be redirected to the chat

## Test Accounts
All these should work after the fix:
- admin@healthcare.com
- doctor@healthcare.com
- nurse@healthcare.com
- peer@healthcare.com
- test.user@healthcare.com

Password: SecurePass123!