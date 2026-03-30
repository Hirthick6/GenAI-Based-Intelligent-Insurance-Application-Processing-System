@echo off
REM Clean up Docker resources for TCE project (Windows)

echo Cleaning up Docker resources...

REM Stop services
echo Stopping services...
docker-compose down

REM Ask about volumes
set /p REMOVE_VOLUMES="Remove volumes (deletes data)? (y/N): "
if /i "%REMOVE_VOLUMES%"=="y" (
    docker-compose down -v
    echo Volumes removed
)

REM Ask about system cleanup
set /p CLEAN_SYSTEM="Clean up unused Docker images/containers? (y/N): "
if /i "%CLEAN_SYSTEM%"=="y" (
    docker system prune -a
    echo Docker system cleaned
)

echo Cleanup complete
