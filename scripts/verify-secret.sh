#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Jaydr GhostCart — Secrets Verification (non-destructive)
# Confirms required secrets exist, are non-empty, and not placeholder values.
# Usage: ./scripts/verify-secret.sh
# Env:  ENV_FILE, DB_HOST, DB_PORT, DB_USER (optional)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ENV_FILE="${ENV_FILE:-.env}"
if [ ! -f "$ENV_FILE" ]; then
  echo "FAIL: $ENV_FILE not found. Copy .env.example to .env first." >&2
  exit 2
fi

REQUIRED=("NEXTAUTH_SECRET" "POSTGRES_PASSWORD" "EBAY_APP_ID" "EBAY_CERT_ID")
fail=0
for k in "${REQUIRED[@]}"; do
  v="$(grep -E "^${k}=" "$ENV_FILE" | head -n1 | cut -d= -f2- || true)"
  if [ -z "$v" ] || [ "$v" = "REPLACE_WITH_"* ]; then
    echo "MISSING/PLACEHOLDER: $k"
    fail=1
  else
    echo "OK: $k is set"
  fi
done

# Optional non-destructive DB reachability check
if command -v pg_isready >/dev/null 2>&1; then
  DB_HOST="${DB_HOST:-localhost}"; DB_PORT="${DB_PORT:-5432}"; DB_USER="${DB_USER:-ghostcart}"
  if PGPASSWORD="${DB_PASSWORD:-}" pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -q; then
    echo "OK: database reachable"
  else
    echo "WARN: database not reachable (verify separately)"
  fi
fi

if [ "$fail" -eq 0 ]; then
  echo "PASS: required secrets configured"
else
  echo "FAIL: rotate missing secrets via scripts/rotate-secrets.sh" >&2
  exit 1
fi
