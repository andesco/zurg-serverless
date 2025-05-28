#!/bin/bash

# Zurg Serverless Setup Script
# This script helps set up KV namespaces and secrets after deployment

echo "🎬 Zurg Serverless Setup"
echo "========================"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install it first:"
    echo "   npm install -g wrangler"
    exit 1
fi

echo "📦 Creating KV namespaces..."

# Create production KV namespace
echo "Creating production KV namespace..."
PROD_OUTPUT=$(wrangler kv namespace create "KV" 2>&1)
PROD_ID=$(echo "$PROD_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

# Create preview KV namespace  
echo "Creating preview KV namespace..."
PREVIEW_OUTPUT=$(wrangler kv namespace create "KV" --preview 2>&1)
PREVIEW_ID=$(echo "$PREVIEW_OUTPUT" | grep -o 'preview_id = "[^"]*"' | cut -d'"' -f2)

if [ -z "$PROD_ID" ] || [ -z "$PREVIEW_ID" ]; then
    echo "❌ Failed to create KV namespaces. Please run manually:"
    echo "   wrangler kv namespace create \"KV\""
    echo "   wrangler kv namespace create \"KV\" --preview"
    exit 1
fi

echo "✅ KV namespaces created successfully!"
echo ""

# Update wrangler.toml
echo "📝 Updating wrangler.toml..."
if [ -f "wrangler.toml" ]; then
    # Replace placeholder IDs with actual IDs
    sed -i.bak "s/YOUR_KV_NAMESPACE_ID/$PROD_ID/g" wrangler.toml
    sed -i.bak "s/YOUR_PREVIEW_KV_NAMESPACE_ID/$PREVIEW_ID/g" wrangler.toml
    rm wrangler.toml.bak 2>/dev/null
    echo "✅ wrangler.toml updated with KV namespace IDs"
else
    echo "❌ wrangler.toml not found in current directory"
    exit 1
fi

echo ""
echo "🔐 Setting up secrets..."

# Set Real-Debrid token
echo "Please enter your Real-Debrid API token:"
echo "(Get it from: https://real-debrid.com/apitoken)"
wrangler secret put RD_TOKEN

echo ""
echo "Optional: Set a dedicated IP address to prevent Real-Debrid account bans"
read -p "Do you have a dedicated IP address? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Please enter your dedicated IP address:"
    wrangler secret put RD_UNRESTRICT_IP
fi

echo ""
echo "🚀 Deploying to Cloudflare Workers..."
wrangler deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "Your Zurg Serverless WebDAV server is now live!"
    echo ""
    echo "📱 HTML Browser: https://$(wrangler whoami 2>/dev/null | grep "subdomain" | cut -d'"' -f4).workers.dev/"
    echo "🔗 WebDAV (Infuse): https://$(wrangler whoami 2>/dev/null | grep "subdomain" | cut -d'"' -f4).workers.dev/infuse/"
    echo "🌐 WebDAV (Standard): https://$(wrangler whoami 2>/dev/null | grep "subdomain" | cut -d'"' -f4).workers.dev/dav/"
    echo ""
    echo "🎯 Next steps:"
    echo "  1. Open the HTML browser to verify your torrents are listed"
    echo "  2. Add the WebDAV URL to Infuse Pro or your preferred client"
    echo "  3. Enjoy seamless streaming from Real-Debrid!"
else
    echo "❌ Deployment failed. Please check the error above and try again."
    exit 1
fi
