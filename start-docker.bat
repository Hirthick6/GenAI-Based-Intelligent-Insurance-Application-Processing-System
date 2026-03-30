@echo off
REM Quick start script for Docker - Run from project root

echo ========================================
echo   TCE Docker Quick Start
echo ========================================
echo.

REM Change to docker directory
cd docker

REM Check if .env exists
if not exist .env (
    echo ERROR: .env file not found!
    echo Please run: copy .env.example .env
    echo Then edit .env with your configuration
    pause
    exit /b 1
)

echo Starting Docker services...
echo.

REM Start docker-compose
docker-compose up -d

echo.
echo ========================================
echo   Services Starting...
echo ========================================
echo.
echo Wait 30-60 seconds, then access:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
echo Login: admin@tce.com / admin123
echo.
echo To view logs: docker-compose logs -f
echo To stop: docker-compose down
echo.

pause
