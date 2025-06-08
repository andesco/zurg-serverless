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

echo -e "${CYAN}Test: Deploy with Cloudflare button${NC}"
echo ""
echo "   1. Deploy new test with button URL; or"
echo "   2. Cleanup all test resources"
echo ""
read -p "$(echo -e ${BLUE}Enter choice [1/2]: ${NC})" action

if [[ $action == "2" ]]; then
    echo ""
    echo -e "${CYAN}Cleaning up ALL test resources...${NC}"
    
    # List and delete all test workers
    echo -e "${BLUE}Finding test workers...${NC}"
    test_workers=$(npx wrangler list 2>/dev/null | grep "$TEST_PREFIX" | awk '{print $2}' || true)
    
    if [[ -n $test_workers ]]; then
        echo -e "${CYAN}Found test workers:${NC}"
        echo "$test_workers"
        echo ""
        read -p "$(echo -e ${YELLOW}Delete all test workers? [y/N]: ${NC})" confirm_workers
        
        if [[ $confirm_workers == "y" || $confirm_workers == "Y" ]]; then
            while IFS= read -r worker; do
                if [[ -n $worker ]]; then
                    echo -e "${CYAN}Deleting worker: $worker${NC}"
                    npx wrangler delete "$worker" --force 2>/dev/null || echo -e "${YELLOW}Failed to delete $worker${NC}"
                fi
            done <<< "$test_workers"
            echo -e "${GREEN}Worker cleanup completed${NC}"
        fi
    else
        echo -e "${YELLOW}No test workers found${NC}"
    fi
    
    # List and delete all test D1 databases
    echo ""
    echo -e "${BLUE}Finding test D1 databases...${NC}"
    test_databases=$(npx wrangler d1 list 2>/dev/null | grep "$TEST_PREFIX" | awk '{print $1}' || true)
    
    if [[ -n $test_databases ]]; then
        echo -e "${CYAN}Found test databases:${NC}"
        echo "$test_databases"
        echo ""
        read -p "$(echo -e ${YELLOW}Delete all test databases? [y/N]: ${NC})" confirm_databases
        
        if [[ $confirm_databases == "y" || $confirm_databases == "Y" ]]; then
            while IFS= read -r database; do
                if [[ -n $database ]]; then
                    echo -e "${CYAN}Deleting database: $database${NC}"
                    npx wrangler d1 delete "$database" --force 2>/dev/null || echo -e "${YELLOW}Failed to delete $database${NC}"
                fi
            done <<< "$test_databases"
            echo -e "${GREEN}Database cleanup completed${NC}"
        fi
    else
        echo -e "${YELLOW}No test databases found${NC}"
    fi
    
    # GitHub repo cleanup instructions
    echo ""
    echo -e "${CYAN}GitHub Repository Cleanup:${NC}"
    echo "   Please manually delete repositories starting with:"
    echo "   https://github.com/andesco/${TEST_PREFIX}-*"
    echo "   (Automated deletion requires GitHub token setup)"
    
    echo ""
    echo -e "${GREEN}Cleanup completed!${NC}"
    exit 0
fi

if [[ $action != "1" ]]; then
    echo -e "${RED}Invalid choice${NC}"
    exit 1
fi

# Continue with deploy test...
echo ""
echo    "To automate this this, the Project and D1 database names must begin with:"
echo ""
echo -e "   ${YELLOW}${TEST_PREFIX}${NC}"
echo ""
echo    "   (example: zurg-serverless-test-01)"
echo ""
read -p "$(echo -e ${BLUE}Deploy to Cloudflare in web browser? [y/N]: ${NC})" confirm

if [[ $confirm != "y" && $confirm != "Y" ]]; then
    echo -e "${RED}Test cancelled${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Deploy to Cloudflare opening in web browser:${NC}"
echo "$DEPLOY_URL"

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
echo -e "${YELLOW}Complete the deployment in your browser:${NC}"
echo "   1. Set worker name: ${TEST_PREFIX}-[suffix]"
echo "   2. Set database name: ${TEST_PREFIX}-[suffix]-db"
echo "   3. Configure required secrets: RD_TOKEN"
echo "   4. Configure optional secrets: USERNAME, PASSWORD"
echo "   5. Confirm deployment."
echo ""

read -p "$(echo -e ${BLUE}Deployment completed and tested successfully? [y/N]: ${NC})" success

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

# Get D1 database name
database_name="${worker_name}-db"
read -p "$(echo -e ${BLUE}D1 database name [press enter for '$database_name']: ${NC})" custom_db
if [[ -n $custom_db ]]; then
    database_name="$custom_db"
fi

# Delete D1 Database
echo -e "${CYAN}Deleting D1 Database: $database_name${NC}"
if npx wrangler d1 delete "$database_name" --force 2>/dev/null; then
    echo -e "${GREEN}D1 database deleted successfully${NC}"
else
    echo -e "${YELLOW}Failed to delete D1 database (may not exist or access denied)${NC}"
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
echo "   - Cleaned up D1 Database: $database_name"
echo "   - Manual cleanup needed for GitHub repo: $github_repo"
