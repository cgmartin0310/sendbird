# Fix for Multi-User Conversation 500 Error

## Issue
Getting 500 Internal Server Error when creating conversations with multiple members.

## Root Cause
The users need to be synced with Sendbird before they can be added to conversations.

## Quick Fix

### 1. In Render Backend Shell:
```bash
cd src
npm run sync:sendbird-users
```

This syncs all database users with Sendbird.

### 2. Alternative: Create & Sync Test Users
```bash
cd src
npm run create:test-users
```

This creates test users AND syncs them with Sendbird automatically.

## Why This Happens

When you select multiple users for a conversation:
1. The frontend correctly sends `memberIds: [1, 2, 3]`
2. Backend tries to add these users to a Sendbird channel
3. If users don't exist in Sendbird, it fails with 500 error

## Verification

After syncing, try creating a conversation again:
1. Select a patient
2. Check the team members you want
3. Create conversation

## If Still Getting Errors

Check the backend logs for specific error messages:
- "User not found" - User needs Sendbird sync
- "profile_url must be required" - Fixed in latest code
- "No compliant members" - Check consent records

## Prevention

The build process now includes user sync, but if you create users manually:
1. Always run `sync:sendbird-users` after
2. Or use the `create:test-users` script which handles sync automatically