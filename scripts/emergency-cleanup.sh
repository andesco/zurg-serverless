#!/bin/bash

echo "🧹 Emergency Workerd Cleanup Script"
echo "====================================="
echo ""

# Check current state
echo "1️⃣ Checking current workerd processes..."
workerd_processes=$(ps aux | grep workerd | grep -v grep | wc -l)
echo "Found $workerd_processes workerd processes"

if [ "$workerd_processes" -eq 0 ]; then
    echo "✅ No workerd processes running - system is clean!"
    exit 0
fi

# Show resource usage before cleanup
echo ""
echo "2️⃣ Current resource usage:"
ps aux | grep workerd | grep -v grep | awk '{cpu+=$3; mem+=$6/1024} END {printf "💻 Total CPU: %.1f%%\n🔧 Total Memory: %.1f MB\n", cpu, mem}'

# Kill processes
echo ""
echo "3️⃣ Terminating workerd processes..."
pkill -f workerd

sleep 2

# Check if processes are still running
remaining=$(ps aux | grep workerd | grep -v grep | wc -l)
if [ "$remaining" -gt 0 ]; then
    echo "⚠️  Some processes still running, force killing..."
    sudo pkill -9 -f workerd
    sleep 1
fi

# Final verification
final_check=$(ps aux | grep workerd | grep -v grep | wc -l)
if [ "$final_check" -eq 0 ]; then
    echo "✅ All workerd processes terminated successfully!"
else
    echo "❌ Some processes may still be running:"
    ps aux | grep workerd | grep -v grep
fi

# Clean temp files
echo ""
echo "4️⃣ Cleaning temporary files..."
rm -rf .wrangler/tmp/* 2>/dev/null && echo "✅ Cleaned .wrangler/tmp/" || echo "ℹ️  No temp files to clean"

echo ""
echo "5️⃣ System is ready for development"
echo "Start development with: npm run dev-safe"
