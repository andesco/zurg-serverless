#!/bin/bash
set -e

echo "🚀 Deploying Zurg Serverless to production..."

# Deploy the worker
echo "📦 Deploying worker..."
npx wrangler deploy --config wrangler.local.toml --env production

# Apply database schema
echo "🗄️ Applying database schema..."
npx wrangler d1 execute zurg-serverless-production-db --config wrangler.local.toml --env production --file schema.sql

echo "✅ Deployment complete!"
echo "🌐 Live at: https://zurg.andrewe.dev"
