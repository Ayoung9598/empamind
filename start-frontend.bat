@echo off
REM Quick start script for frontend development (Windows)

echo 🚀 Starting EmpaMind Frontend...
echo.
echo Choose an option:
echo 1. Start with Docker (recommended)
echo 2. Start without Docker (requires Node.js)
echo.
set /p choice="Enter choice (1 or 2): "

if "%choice%"=="1" (
    echo 🐳 Starting with Docker...
    docker-compose up frontend
) else if "%choice%"=="2" (
    echo 📦 Starting without Docker...
    cd frontend
    if not exist "node_modules" (
        echo Installing dependencies...
        call npm install
    )
    call npm run dev
) else (
    echo Invalid choice. Exiting.
    exit /b 1
)

