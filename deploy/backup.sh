#!/bin/sh
set -eu

PROJECT_DIR=${PROJECT_DIR:-/opt/form-fitness}
BACKUP_DIR=${BACKUP_DIR:-/opt/form-fitness-backups}
STAMP=$(date -u +%Y%m%dT%H%M%SZ)

mkdir -p "$BACKUP_DIR"
cd "$PROJECT_DIR"
docker compose exec -T db pg_dump -U form -d form | gzip > "$BACKUP_DIR/form-$STAMP.sql.gz"
find "$BACKUP_DIR" -type f -name 'form-*.sql.gz' -mtime +14 -delete
