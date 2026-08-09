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

# Generate new JWT secret
NEW_JWT_SECRET=$(openssl rand -base64 32)
echo "Generated new JWT secret"

# Generate new database password (if using managed DB)
NEW_DB_PASSWORD=$(openssl rand -base64 24)
echo "Generated new database password"

# Generate new Redis password (if using managed Redis)
NEW_REDIS_PASSWORD=$(openssl rand -base64 24)
echo "Generated new Redis password"

# Generate new eBay client secret
NEW_EBAY_CLIENT_SECRET=$(openssl rand -hex 32)
echo "Generated new eBay client secret"

# Update .env file (using sed)
echo "Updating .env file with new secrets..."

# Create temporary file
TEMP_ENV=$(mktemp)
trap "rm -f $TEMP_ENV" EXIT

# Copy existing .env and replace secrets
sed "s/^JWT_SECRET=.*/JWT_SECRET=$NEW_JWT_SECRET/" "$ENV_FILE" > "$TEMP_ENV"
sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=$NEW_DB_PASSWORD/" "$TEMP_ENV"
sed -i "s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=$NEW_REDIS_PASSWORD/" "$TEMP_ENV"
sed -i "s/^EBAY_CLIENT_SECRET=.*/EBAY_CLIENT_SECRET=$NEW_EBAY_CLIENT_SECRET/" "$TEMP_ENV"

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

# If using managed Redis, update Redis password
if [ -n "$REDIS_HOST" ] && [ "$REDIS_HOST" != "localhost" ]; then
  echo "Updating Redis password..."
  redis-cli -h "$REDIS_HOST" -p "${REDIS_PORT:-6379}" -a "$REDIS_PASSWORD" CONFIG SET requirepass "$NEW_REDIS_PASSWORD"
  echo "Redis password updated"
fi

# Log rotation
echo "Logging secrets rotation..."
echo "Secrets rotated at $(date)" >> "$BACKUP_DIR/rotation_history.log"
echo "JWT_SECRET rotated" >> "$BACKUP_DIR/rotation_history.log"
echo "DB_PASSWORD rotated" >> "$BACKUP_DIR/rotation_history.log"
echo "REDIS_PASSWORD rotated" >> "$BACKUP_DIR/rotation_history.log"
echo "EBAY_CLIENT_SECRET rotated" >> "$BACKUP_DIR/rotation_history.log"

echo "Secrets rotation completed successfully at $(date)"
echo "Backup saved to: $BACKUP_FILE"
echo ""
echo "IMPORTANT: Restart all services to apply new secrets:"
echo "  - docker-compose down"
echo "  - docker-compose up -d"
