#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Jaydr GhostCart — Decrypt .env from age-encrypted form (.env.age).
# Gracefully SKIPs if `age` is not installed.
# Usage: ./scripts/decrypt-env.sh
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
[ -f "$ENV_ENC" ] || { echo "ERROR: $ENV_ENC not found." >&2; exit 2; }
[ -f "$AGE_KEY_FILE" ] || { echo "ERROR: missing identity $AGE_KEY_FILE" >&2; exit 2; }
age -d -i "$AGE_KEY_FILE" -o "$ENV_FILE" "$ENV_ENC"
echo "Decrypted $ENV_ENC -> $ENV_FILE"
