# Render Deployment Guide for Sendbird Healthcare Messaging App

## Prerequisites
- Render account (https://render.com)
- Sendbird account with App ID and API Token
- GitHub repository with your code

## Step-by-Step Deployment

### 1. Create PostgreSQL Database on Render

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `sendbird-messaging-db`
   - **Database**: `messaging_db` (or leave default)
   - **User**: Leave default
   - **Region**: Oregon (US West) or closest to you
   - **PostgreSQL Version**: 15
   - **Plan**: Free ($0/month for testing)
4. Click **"Create Database"**
5. Wait for provisioning (~2 minutes)
6. Copy the **Internal Database URL** from the database dashboard

### 2. Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect GitHub (authorize if needed)
3. Select repository: `cgmartin0310/sendbird`
4. Configure service:
   - **Name**: `sendbird-messaging-api`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Runtime**: `Node`
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm start`
   - **Plan**: Free tier
5. Click **"Advanced"** and set:
   - **Auto-Deploy**: Yes (optional)
   - **Health Check Path**: `/api/health`

### 3. Environment Variables

Add these in the **Environment** tab of your web service:

```bash
# Required Variables
DATABASE_URL=<Internal Database URL from Step 1>
JWT_SECRET=<Generate using: openssl rand -base64 32>
SENDBIRD_APP_ID=<Your Sendbird App ID>
SENDBIRD_API_TOKEN=<Your Sendbird Master API Token>

# Optional but Recommended
PORT=3000
NODE_ENV=production
JWT_EXPIRES_IN=7d
LOG_LEVEL=info
```

### 4. Getting Your Sendbird Credentials

1. Log in to [Sendbird Dashboard](https://dashboard.sendbird.com)
2. Select your application
3. Go to **Settings** → **Application** → **General**
4. Copy your **App ID**
5. Go to **Settings** → **Application** → **API tokens**
6. Copy your **Master API Token** (or create one)

### 5. Generate JWT Secret

Use one of these methods:
```bash
# macOS/Linux
openssl rand -base64 32

# Or use an online generator (for testing only)
# https://generate-secret.vercel.app/32
```

### 6. Deploy

1. Click **"Create Web Service"**
2. Watch the deployment logs
3. First deployment will:
   - Install all dependencies (including devDependencies)
   - Build TypeScript
   - Run database migrations
   - Start the server

### 7. Verify Deployment

Once deployed, test your API:

```bash
# Check health endpoint
curl https://your-service-name.onrender.com/api/health

# Should return:
# {"status":"ok","timestamp":"2024-01-20T..."}
```

### 8. Create Initial Test Data

1. Register a test user:
```bash
curl -X POST https://your-service-name.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456!",
    "firstName": "Test",
    "lastName": "User",
    "role": "peer_support"
  }'
```

2. Save the returned JWT token for subsequent requests

### 9. Configure Sendbird SMS (Optional)

If using SMS features:
1. In Sendbird Dashboard, go to **Settings** → **Features** → **SMS**
2. Enable SMS messaging
3. Configure your SMS provider (Twilio, MessageBird, etc.)
4. Set webhook URL: `https://your-service-name.onrender.com/api/webhooks/sendbird`

### 10. Monitor Your App

- **Logs**: Available in Render dashboard
- **Metrics**: CPU, Memory, Response times
- **Database**: Monitor in PostgreSQL dashboard

## Troubleshooting

### Common Issues

1. **Build Fails**
   - Check Node version (requires 16+)
   - Verify all dependencies in package.json
   - Ensure build script has execute permissions

2. **Database Connection Errors**
   - Ensure DATABASE_URL is the Internal URL
   - Check database is active

3. **Sendbird Errors**
   - Verify App ID and API Token
   - Check Sendbird dashboard for API limits

4. **Migration Fails**
   - Check database permissions
   - Run migrations manually if needed

### Manual Migration (if needed)
```bash
# SSH into your service (Render Shell)
npm run db:migrate
```

## Performance Tips

1. **Free Tier Limitations**:
   - Spins down after 15 min inactivity
   - First request after idle takes ~30s
   - Limited to 750 hours/month

2. **For Production**:
   - Upgrade to Starter plan ($7/month)
   - Add custom domain
   - Enable zero-downtime deploys

## Security Checklist

- [ ] Strong JWT_SECRET (32+ characters)
- [ ] HTTPS enforced (automatic on Render)
- [ ] Environment variables secure
- [ ] Database SSL enabled (automatic)
- [ ] API rate limiting (implement if needed)

## Next Steps

1. Test all API endpoints
2. Set up monitoring (e.g., UptimeRobot)
3. Configure alerts
4. Plan for scaling
5. Set up staging environment

## Support Resources

- [Render Documentation](https://render.com/docs)
- [Sendbird Documentation](https://sendbird.com/docs)
- Project README for API endpoints
- API.md for endpoint details 