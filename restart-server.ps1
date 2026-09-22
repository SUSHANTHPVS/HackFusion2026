# Restart server script for Windows

Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔄 RESTARTING SERVER WITH FIX" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Kill any node processes running on port 5000
Write-Host "🛑 Stopping current server instances..." -ForegroundColor Yellow
try {
    $process = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($process) {
        $pid = $process.OwningProcess
        Stop-Process -Id $pid -Force
        Write-Host "   ✅ Stopped process $pid on port 5000" -ForegroundColor Green
    } else {
        Write-Host "   ℹ️  No running instances on port 5000" -ForegroundColor Blue
    }
} catch {
    Write-Host "   ℹ️  No running instances found" -ForegroundColor Blue
}

Write-Host ""
Write-Host "⏳ Waiting 2 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "🚀 Starting server with fixed code..." -ForegroundColor Green
Write-Host ""

cd server
npm start
