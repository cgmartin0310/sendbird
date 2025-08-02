# 🔧 Quick Fix: Get Admin Access

## The Issue
The test user (`test.user@healthcare.com`) was created with `peer_support` role instead of `admin` role. That's why you don't see the Admin link.

## Immediate Solution (While Waiting for Deploy)

### Option 1: Use Different Admin User
Login with one of these admin users instead:
- `doctor@healthcare.com` / `SecurePass123!`
- `nurse@healthcare.com` / `SecurePass123!`  
- `peer@healthcare.com` / `SecurePass123!`

Oh wait... these were also created without admin role. Let me check...

### Option 2: Manual Database Update
If you have access to the Render dashboard:
1. Go to your database service
2. Click "Connect" → "PSQL Command"
3. Run this SQL:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'test.user@healthcare.com';
   ```
4. Logout and login again in the app

### Option 3: Wait for Auto-Fix
I've pushed a fix that will:
1. Automatically update the test user to admin role
2. Run during the next deployment (in progress now)
3. Should be ready in 2-3 minutes

## After the Fix
Once deployed or manually updated:
1. **Logout** from the current session (important!)
2. **Login again** with same credentials
3. You'll now see:
   - "Test User (admin)" in top right
   - "Admin" link in navigation
   - Access to all admin pages

## Why This Happened
The original migration script created the test user with `peer_support` role. The fix updates it to `admin` role automatically during deployment.