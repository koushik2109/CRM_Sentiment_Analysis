# CRM Sentiment Analysis - Full Stack Startup Script
# Run this script with: .\start-all.ps1

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  CRM Sentiment Analysis - Starting All Services" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "[1/5] Checking Docker..." -ForegroundColor Yellow
$dockerRunning = docker info 2>$null
if (-not $dockerRunning) {
    Write-Host "  ERROR: Docker is not running! Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}
Write-Host "  Docker is running" -ForegroundColor Green

# Start Redis (if not already running)
Write-Host ""
Write-Host "[2/5] Starting Redis..." -ForegroundColor Yellow
$redisRunning = docker ps --filter "name=redis" --format "{{.Names}}" | Select-String "redis"
if (-not $redisRunning) {
    docker run -d --name redis-local -p 6379:6379 redis:alpine 2>$null
    if ($LASTEXITCODE -ne 0) {
        # Container might exist but be stopped
        docker start redis-local 2>$null
    }
}
Write-Host "  Redis running on port 6379" -ForegroundColor Green

# Start Prometheus & Grafana
Write-Host ""
Write-Host "[3/5] Starting Prometheus & Grafana..." -ForegroundColor Yellow
Push-Location "$PSScriptRoot\monitoring"
docker-compose up -d prometheus grafana 2>$null
Pop-Location
Write-Host "  Prometheus running on http://localhost:9090" -ForegroundColor Green
Write-Host "  Grafana running on http://localhost:3001" -ForegroundColor Green
Write-Host "    Login: team.808.test@gmail.com / team@808" -ForegroundColor DarkGray

# Start Backend Server
Write-Host ""
Write-Host "[4/5] Starting Backend Server..." -ForegroundColor Yellow
$serverJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\server'; npm start" -PassThru
Write-Host "  Backend starting on http://localhost:4000" -ForegroundColor Green
Write-Host "  Metrics at http://localhost:4000/metrics" -ForegroundColor DarkGray

# Start Frontend
Write-Host ""
Write-Host "[5/5] Starting Frontend..." -ForegroundColor Yellow
$clientJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\client'; npm run dev" -PassThru
Write-Host "  Frontend starting on http://localhost:3000" -ForegroundColor Green

# Wait a moment for services to start
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  All Services Started!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend:    http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:     http://localhost:4000" -ForegroundColor White
Write-Host "  Grafana:     http://localhost:3001" -ForegroundColor White
Write-Host "  Prometheus:  http://localhost:9090" -ForegroundColor White
Write-Host ""
Write-Host "  Admin Login:" -ForegroundColor Yellow
Write-Host "    Email:    team.808.test@gmail.com" -ForegroundColor White
Write-Host "    Password: team@808" -ForegroundColor White
Write-Host ""
Write-Host "  Press Enter to open the app in browser..." -ForegroundColor DarkGray
Read-Host

Start-Process "http://localhost:3000"
