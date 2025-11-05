#!/bin/bash

# Script to set environment variables in Vercel
# Project: tesis-ai-math-app-backend

PROJECT_ID="prj_5AThmuA3KkLpOolH3K1uLaH4HAMU"

echo "Setting environment variables for tesis-ai-math-app-backend..."

# Read values from .env file
source .env

# Set each environment variable for production
echo "Setting DATABASE_URL..."
echo "$DATABASE_URL" | npx vercel env add DATABASE_URL production --yes

echo "Setting DIRECT_URL..."
echo "$DIRECT_URL" | npx vercel env add DIRECT_URL production --yes

echo "Setting JWT_SECRET..."
echo "$JWT_SECRET" | npx vercel env add JWT_SECRET production --yes

echo "Setting RECAPTCHA_SECRET_KEY..."
echo "$RECAPTCHA_SECRET_KEY" | npx vercel env add RECAPTCHA_SECRET_KEY production --yes

echo "Setting GEMINI_API_KEY..."
echo "$GEMINI_API_KEY" | npx vercel env add GEMINI_API_KEY production --yes

echo "Setting AI_PROVIDER..."
echo "$AI_PROVIDER" | npx vercel env add AI_PROVIDER production --yes

echo "Setting AI_SERVICE_URL..."
echo "$AI_SERVICE_URL" | npx vercel env add AI_SERVICE_URL production --yes

echo "✅ All environment variables have been set!"
echo "🔄 Triggering a new deployment to apply changes..."
npx vercel deploy --prod --yes
