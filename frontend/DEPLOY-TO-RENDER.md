# Deploy Frontend to Render

## Steps to Deploy

### 1. Create GitHub Repository

First, create a new repository on GitHub:
1. Go to https://github.com/new
2. Name it: `sendbird-healthcare-frontend` 
3. Make it public
4. Don't initialize with README (we already have one)
5. Create repository

### 2. Push to GitHub

```bash
# Add remote origin
git remote add origin https://github.com/cgmartin0310/sendbird-healthcare-frontend.git

# Push to GitHub
git push -u origin main
```

### 3. Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Static Site"**
3. Connect GitHub repository: `cgmartin0310/sendbird-healthcare-frontend`
4. Configure:
   - **Name**: `sendbird-healthcare-frontend`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
5. Add Environment Variable:
   - **VITE_SENDBIRD_APP_ID**: Your Sendbird App ID

### 4. Wait for Deploy

The build will:
- Install dependencies
- Build TypeScript/React
- Deploy static files
- Set up routing

Your frontend will be available at:
```
https://sendbird-healthcare-frontend.onrender.com
```

## Configuration

The `render.yaml` file includes:
- Static site configuration
- Security headers
- SPA routing (all routes → index.html)
- Environment variables

## Important Notes

1. **Add Sendbird App ID**: Must add `VITE_SENDBIRD_APP_ID` in Render environment
2. **API URL**: Already configured to use your backend API
3. **Free Tier**: Static sites don't sleep like web services
4. **Custom Domain**: Can add later in Render settings

## Test After Deploy

1. Visit your frontend URL
2. Register a new account
3. Create a patient
4. Start a conversation
5. Test chat functionality

## Troubleshooting

- **Blank Page**: Check browser console for errors
- **API Errors**: Verify backend is running
- **Chat Not Working**: Ensure Sendbird App ID is set
- **Build Fails**: Check Node version and dependencies
