#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Jaydr GhostCart — Secrets Rotation Script
# Stage: Stage 4 — Reliability and Controlled Automation
# Reference: Stage 4 Plan — Task 6: Secrets Rotation and Backup/Restore
# ─────────────────────────────────────────────────────────────────────────────

set -e

# Configuration
ENV_FILE="${ENV_FILE:-.env}"
BACKUP_DIR="${BACKUP_DIR:-./backups/secrets}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "Starting secrets rotation at $(date)"

# Backup current secrets
BACKUP_FILE="$BACKUP_DIR/env_backup_$TIMESTAMP"
cp "$ENV_FILE" "$BACKUP_FILE"
echo "Backed up current secrets to: $BACKUP_FILE"

# Generate new secrets
echo "Generating new secrets..."

# Generate new NEXTAUTH secret (used for JWT/hashing)
NEW_NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "Generated new NEXTAUTH_SECRET"

# Generate new database password (managed DB only)
NEW_DB_PASSWORD=$(openssl rand -base64 24)
echo "Generated new database password"

# Generate new eBay cert/secret (EBAY_CERT_ID)
NEW_EBAY_CERT_ID=$(openssl rand -hex 32)
echo "Generated new EBAY_CERT_ID"

# Update .env file (using sed)
echo "Updating .env file with new secrets..."

# Create temporary file
TEMP_ENV=$(mktemp)
trap "rm -f $TEMP_ENV" EXIT

# Copy existing .env and replace secrets (env names match .env.example)
sed "s/^NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$NEW_NEXTAUTH_SECRET/" "$ENV_FILE" > "$TEMP_ENV"
sed -i "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$NEW_DB_PASSWORD/" "$TEMP_ENV"
sed -i "s/^EBAY_CERT_ID=.*/EBAY_CERT_ID=$NEW_EBAY_CERT_ID/" "$TEMP_ENV"

# Replace original file
mv "$TEMP_ENV" "$ENV_FILE"

echo "Updated .env file with new secrets"

# If using managed database, update database password
if [ -n "$DB_HOST" ] && [ "$DB_HOST" != "localhost" ]; then
  echo "Updating database password..."
  PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "${DB_PORT:-5432}" \
    -U "${DB_USER:-postgres}" \
    -d "${DB_NAME:-ghostcart}" \
    -c "ALTER USER ${DB_USER:-postgres} WITH PASSWORD '$NEW_DB_PASSWORD';"
  echo "Database password updated"
fi

# Note: local Redis uses REDIS_URL with no password. For managed Redis, set
# REDIS_PASSWORD manually in .env and rotate via the provider console.

# Log rotation
echo "Logging secrets rotation..."
echo "Secrets rotated at $(date)" >> "$BACKUP_DIR/rotation_history.log"
echo "NEXTAUTH_SECRET rotated" >> "$BACKUP_DIR/rotation_history.log"
echo "POSTGRES_PASSWORD rotated" >> "$BACKUP_DIR/rotation_history.log"
echo "EBAY_CERT_ID rotated" >> "$BACKUP_DIR/rotation_history.log"

echo "Secrets rotation completed successfully at $(date)"
echo "Backup saved to: $BACKUP_FILE"
echo ""
echo "IMPORTANT: Restart all services to apply new secrets:"
echo "  - docker-compose down"
echo "  - docker-compose up -d"
