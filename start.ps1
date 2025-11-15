Write-Host "`n☕ Đang khởi động hệ thống...`n" -ForegroundColor Green

$backendRunning = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if (-not $backendRunning) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev"
    Start-Sleep -Seconds 2
} else {
    Write-Host "✅ Server đã chạy" -ForegroundColor Green
}

Start-Process "http://localhost:5500" -ErrorAction SilentlyContinue

Write-Host "📡 Backend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🌐 Frontend: http://localhost:5500`n" -ForegroundColor Cyan
