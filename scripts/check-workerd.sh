#!/bin/bash
echo "=== Workerd Process Check ==="
processes=$(ps aux | grep workerd | grep -v grep)
if [ -z "$processes" ]; then
    echo "✅ No workerd processes running"
else
    echo "⚠️  Found workerd processes:"
    echo "$processes"
    echo ""
    echo "🔧 Kill them with: npm run kill-workerd"
    echo "📊 Total CPU usage:"
    ps aux | grep workerd | grep -v grep | awk '{sum += $3} END {print "   " sum "% CPU usage by workerd processes"}'
fi
