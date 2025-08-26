#!/bin/bash

echo "🚀 ShareNear Deployment Helper"
echo "================================"

echo "📋 Pre-deployment checklist:"
echo "1. ✅ Code pushed to GitHub"
echo "2. ⏳ Railway account created"
echo "3. ⏳ Vercel account created"
echo ""

echo "🔧 Deployment URLs to configure:"
echo "Backend (Railway): https://railway.app/new"
echo "Frontend (Vercel): https://vercel.com/new"
echo ""

echo "📝 Environment Variables to set:"
echo ""
echo "Railway (Backend):"
echo "- PORT: (auto-assigned)"
echo "- NODE_ENV: production"
echo "- CLIENT_URL: https://your-vercel-app.vercel.app"
echo ""
echo "Vercel (Frontend):"
echo "- REACT_APP_SERVER_URL: https://your-railway-app.railway.app"
echo ""

echo "📖 For detailed instructions, see DEPLOYMENT.md"