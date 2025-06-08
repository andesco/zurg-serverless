#!/bin/bash
echo "🚨 EMERGENCY CLEANUP: Killing all workerd processes"
sudo pkill -9 -f workerd 2>/dev/null || true
echo "🧹 Cleaning wrangler temp files"
rm -rf /Users/Andrew/Developer/zurg-serverless/.wrangler/tmp/* 2>/dev/null || true
echo "✅ Emergency cleanup complete"
echo "ℹ️  Restart development with: npm run dev-safe"
