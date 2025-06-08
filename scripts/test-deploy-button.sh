#!/bin/bash

# Test Deploy to Cloudflare Button Script
# Tests the deploy button functionality and cleans up test resources

set -e

DEPLOY_URL="https://deploy.workers.cloudflare.com/?url=https://github.com/andesco/zurg-serverless"
TEST_PREFIX="zurg-serverless-test"

echo "🧪 Deploy Button Test Script"
echo "==============================="
echo ""
echo "⚠️  IMPORTANT: When the deploy page opens, name your worker:"
echo "   ${TEST_PREFIX}-[your-suffix]"
echo ""
echo "   Examples: zurg-serverless-test-123, zurg-serverless-test-feature"
echo ""
read -p "✅ Confirm you understand (y/N): " confirm

if [[ $confirm != "y" && $confirm != "Y" ]]; then
    echo "❌ Test cancelled"
    exit 1
fi

echo ""
echo "🌐 Opening deploy page in browser..."
echo "   URL: $DEPLOY_URL"

# Open URL in default browser (cross-platform)
if command -v open >/dev/null 2>&1; then
    open "$DEPLOY_URL"  # macOS
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$DEPLOY_URL"  # Linux
elif command -v start >/dev/null 2>&1; then
    start "$DEPLOY_URL"  # Windows
else
    echo "❌ Cannot open browser automatically. Please visit:"
    echo "   $DEPLOY_URL"
fi

echo ""
echo "⏳ Complete the deployment in your browser..."
echo "   1. Set worker name: ${TEST_PREFIX}-[suffix]"
echo "   2. Configure secrets (RD_TOKEN, etc.)"
echo "   3. Deploy the worker"
echo "   4. Test that it works"
echo ""

read -p "✅ Deployment completed and tested successfully? (y/N): " success

if [[ $success != "y" && $success != "Y" ]]; then
    echo "❌ Test failed or cancelled"
    exit 1
fi

echo ""
echo "🧹 Cleaning up test resources..."

# Get worker name from user
read -p "🔤 Enter the exact worker name you created: " worker_name

# Validate worker name starts with test prefix
if [[ ! $worker_name =~ ^${TEST_PREFIX} ]]; then
    echo "⚠️  Worker name doesn't start with '${TEST_PREFIX}'"
    read -p "   Continue cleanup anyway? (y/N): " force_cleanup
    if [[ $force_cleanup != "y" && $force_cleanup != "Y" ]]; then
        echo "❌ Cleanup cancelled"
        exit 1
    fi
fi

# Delete Cloudflare Worker
echo "🗑️  Deleting Cloudflare Worker: $worker_name"
if npx wrangler delete "$worker_name" --force 2>/dev/null; then
    echo "✅ Worker deleted successfully"
else
    echo "⚠️  Failed to delete worker (may not exist or access denied)"
fi

# Get GitHub repo name
github_repo="$worker_name"
read -p "🔤 GitHub repo name (press enter for '$github_repo'): " custom_repo
if [[ -n $custom_repo ]]; then
    github_repo="$custom_repo"
fi

# Instructions for GitHub cleanup (can't be automated without GitHub token)
echo ""
echo "🐙 GitHub Repository Cleanup:"
echo "   Please manually delete: https://github.com/andesco/$github_repo"
echo "   (Automated deletion requires GitHub token setup)"

echo ""
echo "✅ Deploy button test completed!"
echo "📋 Summary:"
echo "   - Tested deploy button functionality"
echo "   - Cleaned up Cloudflare Worker: $worker_name"
echo "   - Manual cleanup needed for GitHub repo: $github_repo"
