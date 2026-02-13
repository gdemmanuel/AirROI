# Development Scripts

## clean-start.ps1

**Purpose:** Ensures a clean development environment by killing all old Node processes and starting fresh servers.

**What it does:**
1. ✅ Kills all Node.js processes
2. ✅ Checks for port conflicts (3000, 3001, 3002)
3. ✅ Resolves any port conflicts automatically
4. ✅ Starts both backend and frontend servers
5. ✅ Displays server URLs

**Usage:**

```bash
# Using npm script (recommended)
npm run clean-start

# Or directly with PowerShell
powershell -ExecutionPolicy Bypass -File ./scripts/clean-start.ps1
```

**When to use:**
- Starting development after a crash
- When you see "Port already in use" errors
- When switching between branches
- After pulling new changes
- **Anytime you want to ensure a clean slate**

**Expected Output:**
```
🧹 Cleaning up old Node processes...
✅ All Node processes stopped

🔍 Checking ports 3000, 3001, 3002...
✅ Ports 3000, 3001, 3002 are available

🚀 Starting development servers...
   Backend:  http://localhost:3002
   Frontend: http://localhost:3000

Press Ctrl+C to stop servers
```

## Troubleshooting

**If ports are still in use:**
The script will automatically attempt to kill the conflicting processes. If this fails, you can manually check:

```powershell
# Find what's using a port
Get-NetTCPConnection -LocalPort 3000 -State Listen

# Kill by PID
Stop-Process -Id <PID> -Force
```

**If Node processes won't die:**
```powershell
# Force kill all Node processes
Get-Process node | Stop-Process -Force

# Verify
Get-Process node
```
