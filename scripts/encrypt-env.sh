#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Jaydr GhostCart — Encrypt .env at rest with age (age-encryption.org)
# Gracefully SKIPs if `age` is not installed (so local dev without age works).
# Usage: ./scripts/encrypt-env.sh
# Env:  ENV_FILE, AGE_KEY_FILE, ENV_ENC
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ENV_FILE="${ENV_FILE:-.env}"
AGE_KEY_FILE="${AGE_KEY_FILE:-.age-key.txt}"
ENV_ENC="${ENV_ENC:-${ENV_FILE}.age}"

if ! command -v age >/dev/null 2>&1; then
  echo "SKIP: 'age' not installed (brew install age or https://age-encryption.org)."
  exit 0
fi
[ -f "$ENV_FILE" ] || { echo "ERROR: $ENV_FILE not found." >&2; exit 2; }
if [ ! -f "$AGE_KEY_FILE" ]; then
  echo "Generating age key: $AGE_KEY_FILE (keep secret — add to .gitignore)"
  age-keygen -o "$AGE_KEY_FILE" >/dev/null
  chmod 600 "$AGE_KEY_FILE"
fi
RECIPIENT="$(age-keygen -y "$AGE_KEY_FILE")"
age -r "$RECIPIENT" -o "$ENV_ENC" "$ENV_FILE"
echo "Encrypted $ENV_FILE -> $ENV_ENC (recipient $RECIPIENT)"
