#!/bin/bash

echo "🚀 Deploying ShareNear to Render..."

# Check if git repo is clean
if [[ -n $(git status --porcelain) ]]; then
    echo "⚠️  You have uncommitted changes. Please commit them first."
    git status --short
    exit 1
fi

# Push to main branch
echo "📤 Pushing to GitHub..."
git push origin main

echo "✅ Code pushed to GitHub!"
echo ""
echo "🔗 Next steps (Manual Deployment):"
echo "1. Go to https://render.com and sign up/login"
echo ""
echo "📦 Deploy Backend Service:"
echo "   • Click 'New' → 'Web Service'"
echo "   • Connect your GitHub repository"
echo "   • Name: sharenear-backend"
echo "   • Environment: Node"
echo "   • Build Command: cd server && npm install"
echo "   • Start Command: cd server && npm start"
echo "   • Add Environment Variable: NODE_ENV = production"
echo ""
echo "🌐 Deploy Frontend Service:"
echo "   • Click 'New' → 'Static Site'"
echo "   • Connect your GitHub repository"
echo "   • Name: sharenear-frontend"
echo "   • Build Command: npm run install-client && npm run build"
echo "   • Publish Directory: client/build"
echo "   • Add Environment Variable: REACT_APP_SERVER_URL = [your-backend-url]"
echo ""
echo "📋 Your services will be available at:"
echo "   Backend:  https://sharenear-backend.onrender.com"
echo "   Frontend: https://sharenear-frontend.onrender.com"
echo ""
echo "⏱️  Initial deployment may take 5-10 minutes for free tier services."