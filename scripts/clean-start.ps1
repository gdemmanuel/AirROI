# Clean Start Script - Kills all Node processes and starts fresh
# Usage: .\scripts\clean-start.ps1

Write-Host "Cleaning up old Node processes..." -ForegroundColor Yellow

# Kill all Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait a moment for processes to fully terminate
Start-Sleep -Seconds 2

# Verify cleanup
$remaining = Get-Process node -ErrorAction SilentlyContinue
if ($remaining) {
    Write-Host "Warning: Some Node processes are still running:" -ForegroundColor Red
    $remaining | Format-Table Id,ProcessName,StartTime -AutoSize
    exit 1
} else {
    Write-Host "All Node processes stopped" -ForegroundColor Green
}

# Check for port conflicts
Write-Host ""
Write-Host "Checking ports 3000, 3001, 3002..." -ForegroundColor Yellow

$ports = @(3000, 3001, 3002)
$conflicts = @()

foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($connection) {
        $process = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue
        $conflicts += "Port $port is in use by $($process.ProcessName) (PID: $($process.Id))"
    }
}

if ($conflicts.Count -gt 0) {
    Write-Host "Port conflicts detected:" -ForegroundColor Red
    $conflicts | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "Attempting to kill conflicting processes..." -ForegroundColor Yellow
    
    foreach ($port in $ports) {
        $connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($connection) {
            Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
    
    Start-Sleep -Seconds 2
    Write-Host "Port conflicts resolved" -ForegroundColor Green
} else {
    Write-Host "Ports 3000, 3001, 3002 are available" -ForegroundColor Green
}

# Start the development servers
Write-Host ""
Write-Host "Starting development servers..." -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:3002" -ForegroundColor Gray
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop servers" -ForegroundColor Yellow
Write-Host ""

# Change to project directory and start
Set-Location $PSScriptRoot\..
npm run dev:full
