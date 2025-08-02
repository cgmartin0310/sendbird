# Healthcare Messaging Frontend

A React-based frontend for the Healthcare Messaging System with Sendbird chat integration.

## Features

- 🔐 User authentication (login/register)
- 👥 Patient management
- 💬 Real-time messaging with Sendbird UIKit
- 🏥 Healthcare team conversations
- 📱 SMS integration for external users
- 🔒 HIPAA compliance tracking

## Prerequisites

- Node.js 16+
- Your backend API running (deployed on Render)
- Sendbird account with App ID

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Edit `.env` file with your values:
   ```
   VITE_API_URL=https://sendbird-messaging-api.onrender.com/api
   VITE_SENDBIRD_APP_ID=YOUR_SENDBIRD_APP_ID_HERE
   ```

3. **Get your Sendbird App ID**:
   - Log into [Sendbird Dashboard](https://dashboard.sendbird.com)
   - Select your application
   - Copy the App ID from Settings → Application → General
   - Update `.env` file

4. **Start development server**:
   ```bash
   npm run dev
   ```

   The app will open at http://localhost:5173

## Usage

### First Time Setup

1. **Register a new account**:
   - Go to http://localhost:5173/register
   - Create an account (peer_support or care_team_member role)

2. **Create a patient**:
   - Navigate to Patients page
   - Click "Add Patient"
   - Fill in patient details

3. **Start a conversation**:
   - Go to Conversations page
   - Click "New Conversation"
   - Select a patient
   - The conversation will be created with Sendbird

4. **Chat**:
   - Click on any conversation to open the chat
   - Uses Sendbird UIKit for real-time messaging

## Project Structure

```
src/
├── components/       # Reusable components
├── contexts/        # React contexts (Auth)
├── pages/           # Page components
├── config/          # API configuration
├── types/           # TypeScript types
├── App.tsx          # Main app component
└── main.tsx         # Entry point
```

## Key Technologies

- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Navigation
- **Sendbird UIKit** - Chat UI
- **Tailwind CSS** - Styling
- **Axios** - API calls

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Environment Variables

- `VITE_API_URL` - Backend API URL (defaults to Render deployment)
- `VITE_SENDBIRD_APP_ID` - Your Sendbird application ID

## Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Deploy to Netlify

1. Push to GitHub
2. Import to Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables

## Troubleshooting

### "Sendbird App ID not configured"
- Add `VITE_SENDBIRD_APP_ID` to your `.env` file
- Restart the development server

### API Connection Issues
- Verify backend is running
- Check `VITE_API_URL` in `.env`
- Check CORS settings on backend

### Build Errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version (16+)

## Next Steps

1. Add organization management
2. Implement consent forms
3. Add care team features
4. Enhance SMS integration
5. Add file sharing
6. Implement voice/video calls
