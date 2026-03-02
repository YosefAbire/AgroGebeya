# AgroGebeya Backend Startup Script

Write-Host "Starting AgroGebeya Backend..." -ForegroundColor Green

# Navigate to backend directory
Set-Location backend

# Check if virtual environment exists
if (-Not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Check if database is initialized
Write-Host ""
Write-Host "Do you want to initialize/reset the database? (y/n)" -ForegroundColor Cyan
$response = Read-Host

if ($response -eq "y") {
    Write-Host "Initializing database..." -ForegroundColor Yellow
    python init_db.py
}

# Start server
Write-Host ""
Write-Host "Starting FastAPI server..." -ForegroundColor Green
Write-Host "API will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API docs at: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""

uvicorn app.main:app --reload
