#!/bin/bash

# Local testing script for Zurg Serverless
# This script helps test the worker locally before deployment

set -e

echo "🚀 Zurg Serverless Local Test Script"
echo "===================================="

# Check if required tools are installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed" 
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Type check
echo "🔍 Running TypeScript type check..."
npx tsc --noEmit

# Check if .env.example exists and suggest copying it
if [ -f ".env.example" ] && [ ! -f ".env" ]; then
    echo "📝 .env file not found. Consider copying .env.example:"
    echo "   cp .env.example .env"
    echo "   # Then edit .env with your actual values"
fi

# Start local development server
echo "🏗️  Starting local development server..."
echo "   - WebDAV endpoints will be available at:"
echo "   - http://localhost:8787/dav/"
echo "   - http://localhost:8787/infuse/"
echo ""
echo "📋 Before testing, make sure to set secrets:"
echo "   wrangler secret put RD_TOKEN"
echo "   wrangler secret put RD_UNRESTRICT_IP  # recommended"
echo ""
echo "🎯 Press Ctrl+C to stop the server"
echo ""

npm run dev
