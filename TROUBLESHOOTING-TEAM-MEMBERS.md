# Troubleshooting: Team Member Selection Not Showing

## Issue
The "Add Team Members" section isn't appearing when creating a conversation.

## Fixed Issues
1. **Frontend Build Errors**: Fixed TypeScript errors that were preventing the frontend from building
2. **Visual Styling**: Added blue background to make the UserSelector more visible
3. **Console Logging**: Added debugging logs to track component rendering

## What Should Happen
After selecting a patient in the conversation form, you should see:
- A blue-highlighted section labeled "Add Team Members (Optional)"
- A list of available care team members and admins
- Checkboxes to select which users to add

## Debugging Steps

### 1. Check Browser Console
Open your browser's Developer Tools (F12) and look for these messages:
- `UserSelector rendering - patientId: [number]`
- `Fetching users for patient: [number]`
- `Calling /api/users...`
- `Users response: {...}`

If you don't see these, the component isn't rendering.

### 2. Check API Logs
Look for `/api/users` calls in your backend logs. If missing, the frontend hasn't deployed yet.

### 3. Hard Refresh
- Chrome/Edge: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
- Clear browser cache if needed
- Try incognito/private browsing mode

### 4. Verify Deployment
The latest commit (`0442959`) should show in Render's deploy logs:
- "Fix frontend build errors and improve UserSelector visibility"

### 5. Check User Roles
The system only shows users with these roles:
- `care_team_member`
- `admin`

If your test account (`test.user@healthcare.com`) is the only admin, you might need to create more users.

## Creating Test Users

If you need more users to test with, run this in the Render Shell:

```bash
cd src
psql $DATABASE_URL -c "
INSERT INTO users (email, password_hash, first_name, last_name, role, organization_id) VALUES
('care.team1@healthcare.com', '\$2b\$10\$X.example.hash', 'Care', 'Team One', 'care_team_member', 1),
('care.team2@healthcare.com', '\$2b\$10\$X.example.hash', 'Care', 'Team Two', 'care_team_member', 1),
('admin2@healthcare.com', '\$2b\$10\$X.example.hash', 'Admin', 'Two', 'admin', 1)
ON CONFLICT (email) DO NOTHING;"
```

Then sync them with Sendbird:
```bash
npm run sync:sendbird-users
```

## If Still Not Working

1. **Check Network Tab**: Look for 404 errors on `/api/users`
2. **Verify Route**: Backend should have `GET /api/users` endpoint
3. **Check Permissions**: Ensure you're logged in with proper authentication

## Expected API Response

When working correctly, `/api/users` should return:
```json
{
  "users": [
    {
      "id": 1,
      "email": "test.user@healthcare.com",
      "firstName": "Test",
      "lastName": "User",
      "role": "admin",
      "organizationId": 1
    }
    // ... other users
  ]
}
```

## Quick Test
Try this in your browser console while on the Conversations page:
```javascript
fetch('/api/users', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
  }
}).then(r => r.json()).then(console.log)
```

This will show if the API endpoint is working correctly.