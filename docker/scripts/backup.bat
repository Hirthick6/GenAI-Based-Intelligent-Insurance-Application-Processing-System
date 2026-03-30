@echo off
REM Backup script for TCE database (Windows)

set BACKUP_DIR=backups
set TIMESTAMP=%date:~-4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=%BACKUP_DIR%\tce_backup_%TIMESTAMP%.sql

echo Creating backup...

REM Create backup directory
if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%

REM Backup database
docker-compose exec -T database pg_dump -U postgres tce_project > %BACKUP_FILE%

echo Backup created: %BACKUP_FILE%
