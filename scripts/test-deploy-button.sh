#!/bin/bash

# Test Deploy to Cloudflare Button Script
# Tests the deploy button functionality and cleans up test resources

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

DEPLOY_URL="https://deploy.workers.cloudflare.com/?url=https://github.com/andesco/zurg-serverless"
TEST_PREFIX="zurg-serverless-test"

echo -e "${CYAN}Deploy Button Test Script${NC}"
echo "==============================="
echo ""
echo -e "${YELLOW}IMPORTANT: When the deploy page opens, name your worker:${NC}"
echo "   ${TEST_PREFIX}-[your-suffix]"
echo ""
echo "   Examples: zurg-serverless-test-123, zurg-serverless-test-feature"
echo ""
read -p "$(echo -e ${GREEN}Confirm you understand [y/N]: ${NC})" confirm

if [[ $confirm != "y" && $confirm != "Y" ]]; then
    echo -e "${RED}Test cancelled${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Opening deploy page in browser...${NC}"
echo "   URL: $DEPLOY_URL"

# Open URL in default browser (cross-platform)
if command -v open >/dev/null 2>&1; then
    open "$DEPLOY_URL"  # macOS
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$DEPLOY_URL"  # Linux
elif command -v start >/dev/null 2>&1; then
    start "$DEPLOY_URL"  # Windows
else
    echo -e "${RED}Cannot open browser automatically. Please visit:${NC}"
    echo "   $DEPLOY_URL"
fi

echo ""
echo -e "${YELLOW}Complete the deployment in your browser...${NC}"
echo "   1. Set worker name: ${TEST_PREFIX}-[suffix]"
echo "   2. Configure secrets (RD_TOKEN, etc.)"
echo "   3. Deploy the worker"
echo "   4. Test that it works"
echo ""

read -p "$(echo -e ${GREEN}Deployment completed and tested successfully? [y/N]: ${NC})" success

if [[ $success != "y" && $success != "Y" ]]; then
    echo -e "${RED}Test failed or cancelled${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}Cleaning up test resources...${NC}"

# Get worker name from user
read -p "$(echo -e ${BLUE}Enter the exact worker name you created: ${NC})" worker_name

# Validate worker name starts with test prefix
if [[ ! $worker_name =~ ^${TEST_PREFIX} ]]; then
    echo -e "${YELLOW}Worker name doesn't start with '${TEST_PREFIX}'${NC}"
    read -p "$(echo -e ${YELLOW}Continue cleanup anyway? [y/N]: ${NC})" force_cleanup
    if [[ $force_cleanup != "y" && $force_cleanup != "Y" ]]; then
        echo -e "${RED}Cleanup cancelled${NC}"
        exit 1
    fi
fi

# Delete Cloudflare Worker
echo -e "${CYAN}Deleting Cloudflare Worker: $worker_name${NC}"
if npx wrangler delete "$worker_name" --force 2>/dev/null; then
    echo -e "${GREEN}Worker deleted successfully${NC}"
else
    echo -e "${YELLOW}Failed to delete worker (may not exist or access denied)${NC}"
fi

# Get GitHub repo name
github_repo="$worker_name"
read -p "$(echo -e ${BLUE}GitHub repo name [press enter for '$github_repo']: ${NC})" custom_repo
if [[ -n $custom_repo ]]; then
    github_repo="$custom_repo"
fi

# Instructions for GitHub cleanup (can't be automated without GitHub token)
echo ""
echo -e "${CYAN}GitHub Repository Cleanup:${NC}"
echo "   Please manually delete: https://github.com/andesco/$github_repo"
echo "   (Automated deletion requires GitHub token setup)"

echo ""
echo -e "${GREEN}Deploy button test completed!${NC}"
echo -e "${CYAN}Summary:${NC}"
echo "   - Tested deploy button functionality"
echo "   - Cleaned up Cloudflare Worker: $worker_name"
echo "   - Manual cleanup needed for GitHub repo: $github_repo"
