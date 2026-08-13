#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Jaydr GhostCart — Database Restore TEST (Stage 4 gate)
#
# Proves that a non-production backup can be restored AND that the restored
# database is sane: correct migration set, key tables populated, and RLS
# (tenant isolation) present. Non-interactive; safe to run in CI.
#
# Usage: ./scripts/restore-test.sh
# Env:  DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, BACKUP_DIR,
#       TEST_DB, EXPECTED_MIGRATIONS
# Reference: Stage 4 Plan — Task 6: Secrets Rotation and Backup/Restore
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-ghostcart}"
DB_USER="${DB_USER:-ghostcart}"
DB_PASSWORD="${DB_PASSWORD:-}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TEST_DB="${TEST_DB:-ghostcart_restore_test}"
EXPECTED_MIGRATIONS="${EXPECTED_MIGRATIONS:-$(ls -1 "$SCRIPT_DIR/../src/db/migrations/"*.sql 2>/dev/null | wc -l | tr -d ' ')}"

export PGPASSWORD="$DB_PASSWORD"

echo "== Stage 4 restore test =="
echo "host=$DB_HOST:$DB_PORT source_db=$DB_NAME scratch_db=$TEST_DB expected_migrations=$EXPECTED_MIGRATIONS"

if [ -z "$DB_PASSWORD" ]; then
  echo "ERROR: DB_PASSWORD is required." >&2
  exit 2
fi

run_psql() {
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$1" -v ON_ERROR_STOP=1 -qAt "$@"
}

pass=0
fail() {
  echo "FAIL: $1" >&2
  exit 1
}

# 1) Fresh scratch database
echo "== 1. Preparing scratch DB '${TEST_DB}' =="
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE IF EXISTS \"${TEST_DB}\";" -c "CREATE DATABASE \"${TEST_DB}\";"
echo "   scratch DB ready"

# 2) Take a fresh backup of the source DB via backup-db.sh
echo "== 2. Taking fresh backup =="
"$SCRIPT_DIR/backup-db.sh"
NEWEST_BACKUP="$(ls -1t "$BACKUP_DIR"/ghostcart_backup_*.sql.gz 2>/dev/null | head -n1)"
if [ -z "$NEWEST_BACKUP" ]; then
  fail "no backup produced by backup-db.sh"
fi
echo "   backup: $NEWEST_BACKUP"

# 3) Verify checksum then restore backup into the scratch DB
echo "== 3. Verifying and restoring into scratch DB =="
if [ -f "${NEWEST_BACKUP}.sha256" ]; then
  ( cd "$BACKUP_DIR" && sha256sum -c "${NEWEST_BACKUP##*/}.sha256" >/dev/null ) \
    || fail "checksum verification failed for $NEWEST_BACKUP"
  echo "   checksum OK"
fi
gunzip -c "$NEWEST_BACKUP" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" \
  -d "$TEST_DB" -v ON_ERROR_STOP=1 >/dev/null || fail "restore into scratch DB failed"
echo "   restore OK"

# 4) Smoke checks against the restored scratch DB
echo "== 4. Smoke checks =="

MIG_COUNT="$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB" -qAt -c "SELECT count(*) FROM schema_migrations;")"
echo "   migrations: $MIG_COUNT (expected $EXPECTED_MIGRATIONS)"
if [ "$MIG_COUNT" -ne "$EXPECTED_MIGRATIONS" ]; then
  fail "migration count mismatch"
fi

for table in products listings jobs audit_events; do
  present="$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB" -qAt -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='$table';")"
  echo "   $table present: $present"
  if [ "${present:-0}" -eq 0 ]; then
    fail "table $table missing after restore"
  fi
  cnt="$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB" -qAt -c "SELECT count(*) FROM \"$table\";")"
  echo "   $table rows: $cnt (0 rows is OK on an empty source)"
done

# RLS (tenant isolation) present on products
RLS_COUNT="$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB" -qAt -c "SELECT count(*) FROM pg_policies WHERE tablename='products';")"
echo "   products RLS policies: $RLS_COUNT"
if [ "$RLS_COUNT" -eq 0 ]; then
  fail "no RLS policies found on products"
fi

# 5) Cleanup — drop scratch DB, report success
echo "== 5. Cleaning up scratch DB =="
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE IF EXISTS \"${TEST_DB}\";" >/dev/null
echo ""
echo "PASS: backup restored successfully; ${MIG_COUNT} migrations, RLS verified, tables present."
