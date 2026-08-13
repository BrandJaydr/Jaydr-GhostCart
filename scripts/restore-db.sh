#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Jaydr GhostCart — Database Restore Script
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

# Check if backup file is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  echo "Available backups:"
  ls -lh "$BACKUP_DIR"/ghostcart_backup_*.sql.gz 2>/dev/null || echo "No backups found"
  exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Verify checksum if available
CHECKSUM_FILE="${BACKUP_FILE}.sha256"
if [ -f "$CHECKSUM_FILE" ]; then
  echo "Verifying backup checksum..."
  sha256sum -c "$CHECKSUM_FILE"
  if [ $? -ne 0 ]; then
    echo "Error: Checksum verification failed!"
    exit 1
  fi
  echo "Checksum verified successfully"
else
  echo "Warning: No checksum file found, skipping verification"
fi

# Confirm restore (non-interactive for CI/automation — set RESTORE_CONFIRM=yes)
if [ "${RESTORE_CONFIRM:-no}" != "yes" ]; then
  echo "WARNING: This will overwrite all existing data in database: $DB_NAME"
  echo "To proceed non-interactively, set RESTORE_CONFIRM=yes."
  echo "Aborting (RESTORE_CONFIRM != yes)."
  exit 3
fi

# Decompress and restore
echo "Starting database restore at $(date)"

TEMP_SQL=$(mktemp)
trap "rm -f $TEMP_SQL" EXIT

gunzip -c "$BACKUP_FILE" > "$TEMP_SQL"

PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  < "$TEMP_SQL"

echo "Restore completed successfully at $(date)"
