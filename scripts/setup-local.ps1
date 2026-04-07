# ============================================
# TrustiLock Local Development Setup (Windows)
# ============================================
# Prerequisites:
#   - Node.js 20+
#   - pnpm (npm install -g pnpm)
#   - MongoDB Community Server running locally
# ============================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  TrustiLock Local Development Setup"      -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# -------------------------------------------
# Step 1: Check prerequisites
# -------------------------------------------
Write-Host "[1/4] Checking prerequisites..." -ForegroundColor Yellow

try {
    $nodeVersion = (node -v) -replace 'v',''
    $nodeMajor = [int]($nodeVersion.Split('.')[0])
    if ($nodeMajor -lt 20) {
        Write-Host "  Node.js 20+ required. Found: v$nodeVersion" -ForegroundColor Red
        exit 1
    }
    Write-Host "  Node.js v$nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  Node.js is not installed. Install Node.js 20 LTS first." -ForegroundColor Red
    exit 1
}

try {
    $pnpmVersion = pnpm -v
    Write-Host "  pnpm $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "  pnpm not found. Installing..." -ForegroundColor Yellow
    npm install -g pnpm
}

# Check MongoDB is running
Write-Host ""
Write-Host "[2/4] Checking MongoDB..." -ForegroundColor Yellow
try {
    $mongosh = mongosh --eval "db.runCommand({ping:1})" --quiet mongodb://localhost:27017 2>$null
    Write-Host "  MongoDB is running on port 27017" -ForegroundColor Green
} catch {
    Write-Host "  MongoDB is not running on port 27017." -ForegroundColor Red
    Write-Host "  Start MongoDB Community Server first, then re-run this script." -ForegroundColor Red
    Write-Host "  Tip: Open Services (services.msc) and start 'MongoDB Server'" -ForegroundColor Yellow
    exit 1
}

# -------------------------------------------
# Step 3: Install dependencies
# -------------------------------------------
Write-Host ""
Write-Host "[3/4] Installing dependencies..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  pnpm install failed." -ForegroundColor Red
    exit 1
}

# -------------------------------------------
# Step 4: Create .env if missing
# -------------------------------------------
Write-Host ""
Write-Host "[4/4] Setting up environment..." -ForegroundColor Yellow

if (-not (Test-Path "apps\api\.env")) {
    Copy-Item "apps\api\.env.local" "apps\api\.env"
    Write-Host "  Created apps\api\.env (local MongoDB)" -ForegroundColor Green
} else {
    Write-Host "  apps\api\.env already exists - skipping" -ForegroundColor Yellow
}

# -------------------------------------------
# Done
# -------------------------------------------
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Start all apps:     pnpm dev"
Write-Host "  Start API only:     pnpm dev:api"
Write-Host "  Start web only:     pnpm dev:web"
Write-Host "  Start mobile only:  pnpm dev:mobile"
Write-Host "  Seed database:      pnpm db:seed"
Write-Host ""
Write-Host "  API:     http://localhost:8000"
Write-Host "  Web:     http://localhost:3000"
Write-Host "  Mobile:  Expo on port 5000"
Write-Host "  MongoDB: mongodb://localhost:27017/trustilock"
Write-Host ""
Write-Host "  Swagger: http://localhost:8000/api/docs"
Write-Host ""
