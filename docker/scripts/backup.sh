#!/bin/bash
# Backup script for TCE database

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/tce_backup_$TIMESTAMP.sql"

echo "💾 Creating backup..."

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T database pg_dump -U postgres tce_project > $BACKUP_FILE

echo "✅ Backup created: $BACKUP_FILE"
echo "📦 Size: $(du -h $BACKUP_FILE | cut -f1)"
