# CRM Sentiment Analysis - Stop All Services
# Run this script with: .\stop-all.ps1

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  CRM Sentiment Analysis - Stopping All Services" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Stop Node processes
Write-Host "[1/3] Stopping Node.js processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null
Write-Host "  Node processes stopped" -ForegroundColor Green

# Stop Docker containers
Write-Host ""
Write-Host "[2/3] Stopping Docker containers..." -ForegroundColor Yellow
docker stop crm_prometheus crm_grafana redis-local 2>$null
Write-Host "  Docker containers stopped" -ForegroundColor Green

# Optional: Remove containers
Write-Host ""
Write-Host "[3/3] Cleanup complete" -ForegroundColor Yellow

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  All Services Stopped!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
