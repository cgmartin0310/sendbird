# 🌐 Frontend Access Guide

## Your Deployed URLs

### Frontend (React App)
- **URL**: https://sendbird-diqt.onrender.com
- **Purpose**: User interface for healthcare messaging

### Backend API
- **URL**: https://sendbird-messaging-api.onrender.com
- **Purpose**: REST API endpoints (not for browser access)

## How to Access Admin Pages

### Step 1: Login First
1. Go to: https://sendbird-diqt.onrender.com/login
2. Use admin credentials:
   ```
   Email: test.user@healthcare.com
   Password: SecurePass123!
   ```

### Step 2: Access Admin
After login, you can:
- Click "Admin" in the top navigation (only visible for admin users)
- Or directly visit: https://sendbird-diqt.onrender.com/admin

## Page URLs

### Public Pages (No login required)
- `/login` - Login page
- `/register` - Registration page

### Protected Pages (Login required)
- `/dashboard` - Main dashboard
- `/patients` - Patient management
- `/conversations` - Conversation list
- `/admin` - Admin dashboard (admin role only)
- `/admin/users` - User management (admin only)
- `/admin/organizations` - Organization management (admin only)
- `/admin/consents` - Consent management (admin only)

## Troubleshooting

### "Page not found" error
1. Check if you're logged in
2. Verify the frontend has finished deploying
3. Clear browser cache and try again

### Can't see Admin link
1. Make sure you're logged in as an admin user
2. The test user (test.user@healthcare.com) has admin role

### Frontend not loading
1. Check Render dashboard for deployment status
2. Wait for "Live" status
3. May take 5-10 minutes for new deployments

## Role-Based Access

| Role | Can Access |
|------|------------|
| Admin | All pages including /admin/* |
| Care Team Member | Dashboard, Patients, Conversations |
| Peer Support | Dashboard, Patients, Conversations |

Remember: Always login first before trying to access protected pages!