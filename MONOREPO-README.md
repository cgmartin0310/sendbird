# Healthcare Messaging Platform

A complete healthcare messaging system with Sendbird integration.

## 📁 Repository Structure

This is a monorepo containing both backend and frontend:

```
sendbird/
├── src/                    # Backend source code
├── scripts/                # Backend scripts
├── package.json            # Backend dependencies
├── README.md               # Backend documentation
├── render.yaml             # Backend Render config
└── frontend/               # Frontend application
    ├── src/                # Frontend source code
    ├── package.json        # Frontend dependencies
    ├── vite.config.ts      # Frontend build config
    └── render.yaml         # Frontend Render config
```

## 🚀 Deployment on Render

### Backend (API)
- **Type**: Web Service
- **Root Directory**: `/` (repository root)
- **Build Command**: `npm run render-build`
- **Start Command**: `npm start`
- **URL**: https://sendbird-messaging-api.onrender.com

### Frontend (React App)
- **Type**: Static Site
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **URL**: https://sendbird-healthcare-frontend.onrender.com

## 🔧 Local Development

### Backend
```bash
cd /path/to/sendbird
npm install
npm run dev
# Runs on http://localhost:3000
```

### Frontend
```bash
cd /path/to/sendbird/frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

## 🌐 Environment Variables

### Backend (on Render)
- `DATABASE_URL`
- `JWT_SECRET`
- `SENDBIRD_APP_ID`
- `SENDBIRD_API_TOKEN`

### Frontend (on Render)
- `VITE_SENDBIRD_APP_ID`
- `VITE_API_URL` (optional, defaults to backend URL)

## 📚 Documentation

- Backend API: See `API.md`
- Frontend Setup: See `frontend/README-FRONTEND.md`
- Deployment: See `render-setup.md` and `frontend/DEPLOY-TO-RENDER.md`
