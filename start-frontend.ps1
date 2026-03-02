# AgroGebeya Frontend Startup Script

Write-Host "Starting AgroGebeya Frontend..." -ForegroundColor Green

# Navigate to frontend directory
Set-Location frontend

# Check if pnpm is installed
$pnpmInstalled = Get-Command pnpm -ErrorAction SilentlyContinue

if (-Not $pnpmInstalled) {
    Write-Host "pnpm not found. Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pnpm install

# Start development server
Write-Host ""
Write-Host "Starting Next.js development server..." -ForegroundColor Green
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

pnpm dev
