# Deployment Guide

## Backend Deployment on Railway

1. **Create Railway Account**: Go to [railway.app](https://railway.app) and sign up
2. **Connect Repository**: 
   - Click "New Project" → "Deploy from GitHub repo"
   - Select this repository
3. **Configure Environment Variables**:
   - Go to your project settings
   - Add environment variable: `PORT` (Railway will auto-assign, but you can set it)
4. **Deploy**: Railway will automatically deploy using the `railway.json` configuration

**Railway Environment Variables:**
```
PORT=3001 (optional - Railway auto-assigns)
```

## Frontend Deployment on Vercel

1. **Create Vercel Account**: Go to [vercel.com](https://vercel.com) and sign up
2. **Connect Repository**:
   - Click "New Project" → Import from Git
   - Select this repository
3. **Configure Build Settings**:
   - Framework Preset: Create React App
   - Root Directory: `.` (current directory)
   - Build Command: `npm run build`
   - Output Directory: `build`
4. **Configure Environment Variables**:
   - Add `REACT_APP_SERVER_URL` with your Railway backend URL

**Vercel Environment Variables:**
```
REACT_APP_SERVER_URL=https://your-railway-app.railway.app
```

## Deployment Steps

### Step 1: Deploy Backend First
1. Push your code to GitHub
2. Deploy on Railway following the steps above
3. Note your Railway app URL (e.g., `https://your-app-name.railway.app`)

### Step 2: Deploy Frontend
1. Deploy on Vercel following the steps above
2. Set `REACT_APP_SERVER_URL` to your Railway URL
3. Redeploy if needed

### Step 3: Update CORS (if needed)
If you encounter CORS issues, update the server code to include your Vercel domain in the CORS configuration.

## Alternative: One-Click Deploy

### Railway (Backend)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

### Vercel (Frontend)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

## Environment Variables Summary

**Backend (Railway):**
- `PORT`: Auto-assigned by Railway

**Frontend (Vercel):**
- `REACT_APP_SERVER_URL`: Your Railway backend URL

## Post-Deployment

1. Test the application by visiting your Vercel URL
2. Create a room and verify real-time functionality
3. Test file sharing between different browsers/devices
4. Monitor logs in both Railway and Vercel dashboards