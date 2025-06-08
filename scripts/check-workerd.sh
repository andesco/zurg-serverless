#!/bin/bash

echo "=== Workerd Process Check ==="
echo "Timestamp: $(date)"
echo ""

# Check for workerd processes
processes=$(ps aux | grep workerd | grep -v grep)

if [ -z "$processes" ]; then
    echo "✅ No workerd processes running"
    echo "🎯 System is clean - ready for development"
else
    echo "⚠️  Found workerd processes:"
    echo "$processes"
    echo ""
    
    # Calculate total resource usage
    cpu_total=$(ps aux | grep workerd | grep -v grep | awk '{sum += $3} END {print sum}')
    mem_total=$(ps aux | grep workerd | grep -v grep | awk '{sum += $6/1024} END {print sum}')
    
    echo "💻 Total CPU usage: ${cpu_total:-0}%"
    echo "🔧 Total memory usage: ${mem_total:-0} MB"
    echo ""
    echo "🛠️  Fix commands:"
    echo "   Kill all: pkill -f workerd"
    echo "   Force kill: sudo pkill -9 -f workerd"
    echo "   Clean start: npm run dev-clean"
fi

echo ""
echo "=== Port Usage Check ==="
# Check if development ports are in use
for port in 8787 55535 55769 58951; do
    if lsof -i :$port >/dev/null 2>&1; then
        echo "⚠️  Port $port is in use"
    else
        echo "✅ Port $port is available"
    fi
done
