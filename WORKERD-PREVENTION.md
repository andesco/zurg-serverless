# Workerd Process Management - Quick Reference

## ⚠️ RUNAWAY PROCESS PREVENTION

### Before Starting Development
```bash
# Check for existing processes
npm run dev-check

# Clean start (recommended)
npm run dev-safe
```

### If System Becomes Slow
```bash
# Emergency cleanup
npm run emergency-cleanup

# Or manual cleanup
pkill -f workerd
```

### Development Commands
- `npm run dev` - Standard development (use with caution)
- `npm run dev-safe` - **RECOMMENDED** - Kills existing processes first
- `npm run dev-clean` - Clean start with verification
- `npm run dev-check` - Quick process check
- `npm run dev-status` - Detailed system status
- `npm run kill-workerd` - Kill all workerd processes
- `npm run emergency-cleanup` - Complete system cleanup

### Manual Commands
```bash
# Kill all workerd processes
pkill -f workerd

# Force kill if needed
sudo pkill -9 -f workerd

# Check processes
ps aux | grep workerd | grep -v grep

# Check resource usage
ps aux | grep workerd | awk '{cpu+=$3; mem+=$6/1024} END {printf "CPU: %.1f%% Memory: %.1f MB\n", cpu, mem}'
```

### Red Flags 🚨
- Multiple workerd processes running simultaneously
- workerd processes with >30% CPU usage
- Development server still running after closing terminal
- Port 8787 unavailable when starting development

### Golden Rules
1. **ALWAYS use `npm run dev-safe`** instead of `npm run dev`
2. **NEVER run multiple dev sessions** without killing previous
3. **ALWAYS verify cleanup** after stopping development: `npm run dev-check`
4. **NEVER use background execution** (`npm run dev &`)
5. **When in doubt, cleanup**: `npm run emergency-cleanup`
