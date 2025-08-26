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
echo "1. Go to https://render.com"
echo "2. Click 'New' → 'Blueprint'"
echo "3. Connect your GitHub repository"
echo "4. Render will automatically detect render.yaml and deploy both services"
echo ""
echo "📋 Your services will be available at:"
echo "   Backend:  https://sharenear-backend.onrender.com"
echo "   Frontend: https://sharenear-frontend.onrender.com"
echo ""
echo "⏱️  Initial deployment may take 5-10 minutes for free tier services."