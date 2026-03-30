@echo off
REM Quick stop script for Docker - Run from project root

echo ========================================
echo   TCE Docker Stop
echo ========================================
echo.

REM Change to docker directory
cd docker

echo Stopping Docker services...
echo.

REM Stop docker-compose
docker-compose down

echo.
echo ========================================
echo   Services Stopped
echo ========================================
echo.

pause
