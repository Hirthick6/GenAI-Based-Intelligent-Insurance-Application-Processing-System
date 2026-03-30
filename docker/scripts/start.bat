@echo off
REM Start script for TCE Docker services (Windows)

echo Starting TCE Insurance Document Processor...

REM Check if .env exists
if not exist .env (
    echo .env file not found. Copying from .env.example...
    copy .env.example .env
    echo Please edit docker\.env with your configuration
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo Docker is not running. Please start Docker Desktop.
    exit /b 1
)

REM Build and start services
echo Building Docker images...
docker-compose build

echo Starting services...
docker-compose up -d

echo Waiting for services to be healthy...
timeout /t 10 /nobreak >nul

REM Check service health
echo Checking service health...
docker-compose ps

echo.
echo TCE Application is running!
echo.
echo Access points:
echo    Frontend:  http://localhost:3000
echo    Backend:   http://localhost:8000
echo    API Docs:  http://localhost:8000/docs
echo.
echo View logs: docker-compose logs -f
echo Stop services: docker-compose down
