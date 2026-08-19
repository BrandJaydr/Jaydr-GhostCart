/**
 * CLI Configuration Store
 *
 * Persists the user's auth token and base URL in ~/.ghostcart/config.json
 * with restricted permissions (mode 0600) so the token is only readable
 * by the current OS user.
 *
 * Config shape:
 *   {
 *     "baseUrl": "https://app.ghostcart.io",
 *     "token": "eyJhb...",
 *     "email": "user@example.com",
 *     "tenantId": "uuid",
 *     "role": "owner"
 *   }
 */

import { homedir } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'fs';

export interface GhostCartConfig {
  baseUrl: string;
  token: string;
  email: string;
  tenantId: string;
  role: string;
}

const CONFIG_DIR  = join(homedir(), '.ghostcart');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

/** Default server URL — overridden by `ghostcart config set-url <url>` */
export const DEFAULT_BASE_URL = process.env.GHOSTCART_URL ?? 'http://localhost:3000';

export function loadConfig(): Partial<GhostCartConfig> {
  if (!existsSync(CONFIG_FILE)) return {};
  try {
    const raw = readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw) as Partial<GhostCartConfig>;
  } catch {
    return {};
  }
}

export function saveConfig(updates: Partial<GhostCartConfig>): void {
  const current = loadConfig();
  const merged  = { ...current, ...updates };

  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }

  writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), { mode: 0o600 });

  // Ensure permissions are restricted even on subsequent writes
  try { chmodSync(CONFIG_FILE, 0o600); } catch { /* non-POSIX OS */ }
}

export function clearConfig(): void {
  if (existsSync(CONFIG_FILE)) {
    writeFileSync(CONFIG_FILE, '{}', { mode: 0o600 });
  }
}

export function requireConfig(): GhostCartConfig {
  const cfg = loadConfig();
  if (!cfg.token || !cfg.baseUrl) {
    console.error('\n  ✗ Not logged in. Run: ghostcart login\n');
    process.exit(1);
  }
  return cfg as GhostCartConfig;
}

export interface GhostCartPreferences {
  staticBannerId?: string | null;
}

const PREF_FILE = join(CONFIG_DIR, 'preferences.json');

export function loadPreferences(): GhostCartPreferences {
  if (!existsSync(PREF_FILE)) return {};
  try {
    const raw = readFileSync(PREF_FILE, 'utf-8');
    return JSON.parse(raw) as GhostCartPreferences;
  } catch {
    return {};
  }
}

export function savePreferences(updates: Partial<GhostCartPreferences>): void {
  const current = loadPreferences();
  const merged  = { ...current, ...updates };

  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }

  writeFileSync(PREF_FILE, JSON.stringify(merged, null, 2), { mode: 0o600 });
}
