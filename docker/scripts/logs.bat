@echo off
REM View logs for TCE Docker services (Windows)

set SERVICE=%1

if "%SERVICE%"=="" (
    echo Viewing logs for all services...
    docker-compose logs -f
) else (
    echo Viewing logs for %SERVICE%...
    docker-compose logs -f %SERVICE%
)
