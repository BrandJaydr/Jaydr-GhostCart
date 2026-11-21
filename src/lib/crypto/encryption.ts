/**
 * Application-layer authenticated encryption for dynamic tenant tokens.
 *
 * GC-102 (Option 2) keeps static provider keys in .env and stores dynamic
 * marketplace OAuth tokens in `marketplace_connections` as ciphertext. Node's
 * built-in AES-256-GCM gives confidentiality plus integrity without adding a
 * dependency or an external secret service. Each value gets a fresh 12-byte
 * IV, so encrypting the same token twice never produces the same ciphertext.
 *
 * Envelope format (all parts base64 except the version):
 *   v1:<iv>:<authTag>:<ciphertext>
 *
 * The master key is operator-supplied and never lives in source control.
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;
const VERSION = 'v1';

/** ENCRYPTION_KEY is canonical; TOKEN_ENCRYPTION_KEY is the older alias. */
const KEY_ENV_NAMES = ['ENCRYPTION_KEY', 'TOKEN_ENCRYPTION_KEY'] as const;

function loadKey(): Buffer {
  const name = KEY_ENV_NAMES.find((candidate) => process.env[candidate]);
  const raw = name ? process.env[name] : undefined;
  if (!raw) {
    throw new Error(
      'Marketplace token encryption is not configured: set ENCRYPTION_KEY (64 hex characters) in the environment',
    );
  }
  // Require an explicitly generated 32-byte key. Never derive a weak key from
  // a short passphrase — the master key must be operator-supplied.
  if (!new RegExp(`^[0-9a-fA-F]{${KEY_BYTES * 2}}$`).test(raw)) {
    throw new Error('ENCRYPTION_KEY must be exactly 64 hexadecimal characters (32 bytes)');
  }
  return Buffer.from(raw, 'hex');
}

/**
 * Fail before doing any upstream work that yields a one-time secret. eBay
 * returns the refresh token only on exchange; losing it because the DB write
 * cannot encrypt would force a full re-authorization.
 */
export function assertEncryptionConfigured(): void {
  loadKey();
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, loadKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString('base64'),
    tag.toString('base64'),
    ciphertext.toString('base64'),
  ].join(':');
}

export function decrypt(envelope: string): string {
  const parts = envelope.split(':');
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error('Invalid encrypted token envelope');
  }

  const iv = Buffer.from(parts[1], 'base64');
  const tag = Buffer.from(parts[2], 'base64');
  const ciphertext = Buffer.from(parts[3], 'base64');
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES || ciphertext.length === 0) {
    throw new Error('Invalid encrypted token envelope');
  }

  const decipher = createDecipheriv(ALGORITHM, loadKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
