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
echo "🔗 Next steps:"
echo "1. Go to https://render.com and sign up/login"
echo ""
echo "📦 STEP 1 - Deploy Backend via Blueprint:"
echo "   • Click 'New' → 'Blueprint'"
echo "   • Connect your GitHub repository"
echo "   • This will create the backend service automatically"
echo "   • Note the backend URL (e.g., https://sharenear-backend.onrender.com)"
echo ""
echo "🌐 STEP 2 - Deploy Frontend Manually:"
echo "   • Click 'New' → 'Static Site'"
echo "   • Connect your GitHub repository"
echo "   • Name: sharenear-frontend"
echo "   • Build Command: npm run install-client && npm run build"
echo "   • Publish Directory: client/build"
echo "   • Add Environment Variable: REACT_APP_SERVER_URL = [your-backend-url]"
echo ""
echo "⚠️  Note: Render blueprints only support web services, not static sites"
echo "   So the frontend must be deployed manually as a separate step."
echo ""
echo "📋 Your services will be available at:"
echo "   Backend:  https://sharenear-backend.onrender.com"
echo "   Frontend: https://sharenear-frontend.onrender.com"
echo ""
echo "⏱️  Initial deployment may take 5-10 minutes for free tier services."