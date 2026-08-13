#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Jaydr GhostCart — Database Backup Script
# Stage: Stage 4 — Reliability and Controlled Automation
# Reference: Stage 4 Plan — Task 6: Secrets Rotation and Backup/Restore
# ─────────────────────────────────────────────────────────────────────────────

set -e

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-ghostcart}"
DB_USER="${DB_USER:-ghostcart}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/ghostcart_backup_$TIMESTAMP.sql"

echo "Starting database backup at $(date)"
echo "Backup file: $BACKUP_FILE"

# Perform backup
PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --format=plain \
  --no-owner \
  --no-acl \
  --verbose \
  > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

echo "Backup completed: $BACKUP_FILE"

# Calculate checksum
CHECKSUM=$(sha256sum "$BACKUP_FILE" | awk '{print $1}')
echo "SHA256 checksum: $CHECKSUM"

# Store checksum
echo "$CHECKSUM  $BACKUP_FILE" > "$BACKUP_FILE.sha256"

# Clean up old backups (retention policy)
find "$BACKUP_DIR" -name "ghostcart_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "ghostcart_backup_*.sql.gz.sha256" -mtime +$RETENTION_DAYS -delete

echo "Old backups cleaned up (retention: $RETENTION_DAYS days)"
echo "Backup process completed at $(date)"
