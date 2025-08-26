# Manual Render Deployment Guide

## Step 1: Deploy Backend Service

1. Go to [render.com](https://render.com) and sign up/login
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `sharenear-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Auto-Deploy**: Yes (recommended)

5. Add Environment Variables:
   - `NODE_ENV` = `production`

6. Click **"Create Web Service"**
7. **Important**: Copy the service URL (e.g., `https://sharenear-backend.onrender.com`)

## Step 2: Deploy Frontend Service

1. Click **"New"** → **"Static Site"**
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `sharenear-frontend`
   - **Build Command**: `npm run install-client && npm run build`
   - **Publish Directory**: `client/build`
   - **Auto-Deploy**: Yes (recommended)

4. Add Environment Variables:
   - `REACT_APP_SERVER_URL` = `https://sharenear-backend.onrender.com` (use your actual backend URL)

5. Click **"Create Static Site"**

## Step 3: Test Your Deployment

1. Wait for both services to finish deploying (5-10 minutes)
2. Visit your frontend URL
3. Test creating a room and file sharing functionality

## Troubleshooting

- **Backend not starting**: Check the logs in Render dashboard
- **Frontend can't connect**: Verify `REACT_APP_SERVER_URL` is correct
- **CORS errors**: The server is already configured for Render domains

## Free Tier Limits

- **Web Services**: 750 hours/month (sleeps after 15 min of inactivity)
- **Static Sites**: Unlimited bandwidth and builds
- **Build time**: 500 minutes/month