import type { ISupplierAdapter } from './supplier.interface';
import type { CanonicalProduct } from '@/lib/types/canonical';
import type { PoolClient } from 'pg';
import { createHash } from 'node:crypto';
import { normalizeCsvRow } from './normalize';
import { AirtableOAuthClient } from './airtable/oauth-client';

/**
 * AirtableSupplierAdapter — "Sign in with Airtable" (OAuth 2.0)
 *
 * Implements ISupplierAdapter over the Airtable REST API. Credentials are
 * per-user OAuth tokens stored in `airtable_connections` (migration 0020),
 * resolved per tenant at import time — never in env vars, never in code.
 *
 * IMPORTANT BOUNDARIES (Forge/Atlas rules):
 *   • Vendor payloads are normalized to CanonicalProduct here — never in
 *     components or API routes.
 *   • Only fields present in BOTH the Airtable base AND the canonical CSV
 *     field set are synced (the user's "shared field headers" requirement).
 *   • The configured Airtable field names are resolved to canonical keys via
 *     `fieldMapping`; unmapped-but-shared field names are matched by identity.
 *   • No network in unit tests: inject a `fetcher` and/or a `configResolver`.
 */

export interface AirtableSourceConfig {
  accessToken: string;
  baseId: string;
  tableName: string;
  fieldMapping?: Record<string, string>;
}

export interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

export type AirtableFetcher = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

export type AirtableConfigResolver = (
  tenantId: string,
) => Promise<AirtableSourceConfig | null>;

/** Canonical CSV keys shared with the CSV/HTML adapters (normalize.ts). */
const CANONICAL_KEYS = new Set([
  'title',
  'description',
  'supplier_price_cents',
  'currency',
  'availability',
  'source_url',
  'sku',
  'gtin',
  'upc',
  'primary_image_url',
  'additional_image_urls',
]);

/**
 * Coerce a single Airtable field value to a CSV-style string.
 * Airtable richer types (number, boolean, attachment arrays, multi-select)
 * are reduced to the string representation normalizeCsvRow expects.
 */
export function coerceAirtableField(
  value: unknown,
  canonicalKey: string,
): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'yes' : 'no';

  if (Array.isArray(value)) {
    const parts = value
      .map((item): string | null => {
        if (typeof item === 'string') return item.trim() || null;
        if (item && typeof item === 'object') {
          const u = (item as { url?: unknown }).url;
          if (typeof u === 'string') return u.trim() || null;
          return null;
        }
        return null;
      })
      .filter((p): p is string => p !== null);

    if (canonicalKey === 'primary_image_url') return parts[0] ?? '';
    if (canonicalKey === 'additional_image_urls') return parts.join('|');
    return parts.join('|');
  }

  if (value && typeof value === 'object') {
    const u = (value as { url?: unknown }).url;
    if (typeof u === 'string') return u.trim();
    return '';
  }

  return '';
}

/**
 * Build a CSV-style row from an Airtable record's fields.
 * Only fields shared by BOTH sides are emitted: explicit `fieldMapping`
 * entries (canonical key -> Airtable field name) win; otherwise a field
 * whose name matches a canonical key by identity is used.
 */
export function coerceAirtableRow(
  fields: Record<string, unknown>,
  fieldMapping: Record<string, string> = {},
): Record<string, string> {
  const row: Record<string, string> = {};

  for (const [canonicalKey, airtableFieldName] of Object.entries(fieldMapping)) {
    if (!CANONICAL_KEYS.has(canonicalKey)) continue;
    if (!Object.prototype.hasOwnProperty.call(fields, airtableFieldName)) continue;
    row[canonicalKey] = coerceAirtableField(fields[airtableFieldName], canonicalKey);
  }

  for (const canonicalKey of CANONICAL_KEYS) {
    if (Object.prototype.hasOwnProperty.call(row, canonicalKey)) continue;
    if (!Object.prototype.hasOwnProperty.call(fields, canonicalKey)) continue;
    row[canonicalKey] = coerceAirtableField(fields[canonicalKey], canonicalKey);
  }

  return row;
}

/**
 * Deterministic, collision-resistant product id for an Airtable source URL.
 * NOTE: the shared CSV/HTML `normalizeCsvRow` scheme truncates base64 of the
 * URL to 12 chars — URLs sharing a long prefix (e.g. every record URL under
 * the same Airtable base) collide. Airtable therefore uses a SHA-256 digest.
 */
export function airtableProductId(sourceUrl: string): string {
  return `product_${createHash('sha256').update(sourceUrl).digest('hex').slice(0, 16)}`;
}

/** One row from `airtable_connections` (per-user OAuth credentials). */
export interface AirtableConnectionRow {
  id: string;
  user_id: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  base_id: string | null;
  connected_at: string;
}

/** The tenant's `suppliers.config` row for the airtable adapter (non-secret). */
export interface AirtableSupplierConfig {
  baseId?: string | null;
  tableName?: string | null;
  fieldMapping?: Record<string, string>;
}

/**
 * Deterministically pick the tenant's active connection. The worker resolves
 * adapters by tenantId only (no per-user context), so per-user connection rows
 * would otherwise be ambiguous. The tenant owner's connection wins; otherwise
 * the most-recently connected row. Pure function — unit-tested without DB.
 */
export function pickTenantConnection(
  rows: AirtableConnectionRow[],
  ownerUserId: string | null,
): AirtableConnectionRow | null {
  if (rows.length === 0) return null;
  const ownerRows = ownerUserId
    ? rows.filter((r) => r.user_id === ownerUserId)
    : [];
  const candidates = ownerRows.length > 0 ? ownerRows : rows;
  return (
    [...candidates].sort(
      (a, b) =>
        new Date(b.connected_at).getTime() - new Date(a.connected_at).getTime(),
    )[0] ?? null
  );
}

/**
 * True when the stored access token must be refreshed before use: missing,
 * malformed, already expired, or expiring inside the safety window.
 */
export function shouldRefreshToken(
  expiresAt: string | null | undefined,
  now: Date = new Date(),
  safetyWindowMs = 60_000,
): boolean {
  if (!expiresAt) return true;
  const t = new Date(expiresAt).getTime();
  if (Number.isNaN(t)) return true;
  return t <= now.getTime() + safetyWindowMs;
}

/**
 * Refresh a stale access token and persist the rotated token pair.
 * Best-effort: returns the fresh access token on success, or null when the
 * refresh token is missing/invalid/unreachable — the caller keeps the stored
 * token and a 401 from the Airtable API surfaces the re-connect need.
 */
async function refreshStoredAccessToken(
  client: PoolClient,
  conn: AirtableConnectionRow,
): Promise<string | null> {
  if (!conn.refresh_token) return null;
  const clientId = process.env.AIRTABLE_CLIENT_ID || '';
  const clientSecret = process.env.AIRTABLE_CLIENT_SECRET || '';
  if (!clientId || !clientSecret) return null;

  const redirectUri = `${(process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')}/api/airtable/callback`;

  try {
    const oauth = new AirtableOAuthClient({ clientId, clientSecret, redirectUri });
    const fresh = await oauth.refreshAccessToken(conn.refresh_token);
    await client.query(
      `UPDATE airtable_connections
          SET access_token = $1,
              refresh_token = COALESCE($2, refresh_token),
              token_expires_at = $3
        WHERE id = $4`,
      [fresh.accessToken, fresh.refreshToken, fresh.expiresAt.toISOString(), conn.id],
    );
    return fresh.accessToken;
  } catch {
    // Refresh failed (revoked token / network). Keep the stored token — a 401
    // from the Airtable API will surface a clear re-connect prompt.
    return null;
  }
}

/**
 * Default resolver: reads the tenant's airtable connections (per-user rows)
 * plus the supplier `config` under RLS, then resolves the active access token
 * (auto-refreshing when stale). Uses a dynamic import so the adapter module
 * stays importable in unit tests without a live DATABASE_URL.
 */
export async function resolveAirtableConfig(
  tenantId: string,
): Promise<AirtableSourceConfig | null> {
  const { withTenant } = await import('@/lib/db');

  return withTenant(tenantId, async (client) => {
    // 1. Tenant owner (earliest-created) gives the deterministic winner so the
    //    worker's tenantId-only resolution is stable across per-user rows.
    const ownerRes = await client.query<{ id: string }>(
      `SELECT id
         FROM users
        WHERE tenant_id = $1 AND role = 'owner'
        ORDER BY created_at ASC
        LIMIT 1`,
      [tenantId],
    );
    const ownerUserId = ownerRes.rows[0]?.id ?? null;

    // 2. Read all per-user connections (preserved for audit) and pick one.
    const connRes = await client.query<AirtableConnectionRow>(
      `SELECT id, user_id, access_token, refresh_token, token_expires_at,
              base_id, connected_at
         FROM airtable_connections
        WHERE tenant_id = $1`,
      [tenantId],
    );
    const conn = pickTenantConnection(connRes.rows, ownerUserId);
    if (!conn?.access_token) return null;

    // 3. Auto-refresh a stale access token (persist the rotated pair).
    let accessToken = conn.access_token;
    if (shouldRefreshToken(conn.token_expires_at, new Date())) {
      const refreshed = await refreshStoredAccessToken(client, conn);
      if (refreshed) accessToken = refreshed;
    }

    // 4. Resolve base/table from the connection or the supplier config.
    const sup = await client.query<{ config: AirtableSupplierConfig | null }>(
      `SELECT config
         FROM suppliers
        WHERE tenant_id = $1 AND adapter_id = 'airtable'
        LIMIT 1`,
      [tenantId],
    );
    const config = sup.rows[0]?.config;
    const baseId = conn.base_id ?? config?.baseId ?? null;
    const tableName = config?.tableName ?? null;
    if (!baseId || !tableName) return null;

    return {
      accessToken,
      baseId,
      tableName,
      fieldMapping: config?.fieldMapping ?? {},
    };
  });
}

export class AirtableSupplierAdapter implements ISupplierAdapter {
  readonly adapterId = 'airtable';

  private readonly fetcher: AirtableFetcher;
  private readonly configResolver: AirtableConfigResolver;

  constructor(options?: {
    fetcher?: AirtableFetcher;
    configResolver?: AirtableConfigResolver;
  }) {
    this.fetcher =
      options?.fetcher ??
      ((input: string | URL, init?: RequestInit) => fetch(input, init));
    this.configResolver = options?.configResolver ?? resolveAirtableConfig;
  }

  /**
   * Fetch ALL records from the configured Airtable base+table (auth via token),
   * following `offset` cursors until the API returns no next page. The Records
   * API caps a page at 100 records, so without this loop catalogs >100 rows
   * silently truncate and later rows could never be matched.
   */
  private async fetchRecords(
    config: AirtableSourceConfig,
  ): Promise<AirtableRecord[]> {
    const records: AirtableRecord[] = [];
    let offset: string | null = null;
    let page = 0;
    const maxPages = 50; // safety cap (50 × 100 = 5,000 rows per table)

    do {
      const url = new URL(
        `https://api.airtable.com/v0/${encodeURIComponent(config.baseId)}/${encodeURIComponent(config.tableName)}`,
      );
      if (offset) url.searchParams.set('offset', offset);

      const res = await this.fetcher(url.toString(), {
        headers: { Authorization: `Bearer ${config.accessToken}` },
      });
      if (!res.ok) {
        throw new Error(`Airtable API returned HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        records?: AirtableRecord[];
        offset?: string;
      };
      records.push(...(data.records ?? []));
      offset = data.offset ?? null;
      page += 1;
    } while (offset && page < maxPages);

    return records;
  }

  /**
   * Match a record by rec-id in the URL, a shared source_url, or fallback.
   * source_url matching runs on the COERCED row so explicit `fieldMapping`
   * entries (e.g. an Airtable column named "Product URL") are honored — the
   * SAME view used to derive the deterministic product id.
   */
  private pickRecord(
    records: AirtableRecord[],
    sourceUrl: string,
    fieldMapping: Record<string, string>,
  ): AirtableRecord | null {
    const recMatch = sourceUrl.match(/\/(rec[A-Za-z0-9]+)(?:\?|$|\/)/);
    if (recMatch) {
      const match = records.find((r) => r.id === recMatch[1]);
      if (match) return match;
    }

    const trim = sourceUrl.trim();
    const urlMatch = records.find((r) => {
      const row = coerceAirtableRow(r.fields, fieldMapping);
      return (row.source_url ?? '').trim() === trim;
    });
    if (urlMatch) return urlMatch;

    return records[0] ?? null;
  }

  async validateConnection(): Promise<{ valid: boolean; reason?: string; details?: AirtableRecord[] }> {
    const token = process.env.AIRTABLE_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_TABLE;

    if (!token || !baseId || !tableName) {
      return {
        valid: false,
        reason:
          'No Airtable connection configured — connect via the "Sign in with Airtable" flow, or set AIRTABLE_TOKEN/AIRTABLE_BASE_ID/AIRTABLE_TABLE for ops checks.',
      };
    }

    try {
      const records = await this.fetchRecords({ accessToken: token, baseId, tableName });
      return { valid: true, reason: 'Airtable connection is valid', details: records };
    } catch (err) {
      return { valid: false, reason: (err as Error).message };
    }
  }

  async importProduct(url: string, tenantId: string): Promise<CanonicalProduct> {
    const config = await this.configResolver(tenantId);
    if (!config) {
      throw new Error(
        'No Airtable connection configured for this tenant — connect via "Sign in with Airtable" first.',
      );
    }

    const records = await this.fetchRecords(config);
    const record = this.pickRecord(records, url, config.fieldMapping ?? {});
    if (!record) {
      throw new Error('Airtable base contains no product records');
    }

    const row = coerceAirtableRow(record.fields, config.fieldMapping);
    if (!(row.title ?? '').trim()) {
      throw new Error('Airtable record is missing a title — cannot import');
    }

    const candidate = (row.source_url ?? '').trim();
    const sourceUrl =
      candidate ||
      `https://airtable.com/${config.baseId}/${config.tableName}/${record.id}`;

    const product = normalizeCsvRow(row, tenantId, this.adapterId, sourceUrl);
    return {
      ...product,
      id: airtableProductId(sourceUrl),
      rawSourceMetadata: {
        adapter: this.adapterId,
        airtableRecordId: record.id,
        rawFields: record.fields, // truly-raw vendor payload (traceability)
        originalRow: row, // canonicalized shared-field view
      },
    };
  }

  async fetchProduct(productId: string, tenantId: string): Promise<CanonicalProduct> {
    const config = await this.configResolver(tenantId);
    if (!config) {
      throw new Error(
        'No Airtable connection configured for this tenant — connect via "Sign in with Airtable" first.',
      );
    }

    const records = await this.fetchRecords(config);
    // Recompute the deterministic id the SAME way importProduct does, always
    // from the COERCED row so a fieldMapping source-URL column is honored
    // (prevents a no-match that previously fell back to records[0] and would
    // silently write the wrong product).
    const normalized = records.map((r) => {
      const row = coerceAirtableRow(r.fields, config.fieldMapping);
      const source =
        (row.source_url ?? '').trim() ||
        `https://airtable.com/${config.baseId}/${config.tableName}/${r.id}`;
      const id = airtableProductId(source);
      return { record: r, row, source, id };
    });

    const chosen = normalized.find((n) => n.id === productId);
    if (!chosen) {
      // No silent fallback: refreshing the wrong product would corrupt data.
      throw new Error(`Cannot resolve Airtable record for product ID: ${productId}`);
    }
    if (!(chosen.row.title ?? '').trim()) {
      throw new Error('Airtable record is missing a title — cannot refresh');
    }

    const product = normalizeCsvRow(
      chosen.row,
      tenantId,
      this.adapterId,
      chosen.source,
    );
    return {
      ...product,
      id: airtableProductId(chosen.source),
      rawSourceMetadata: {
        adapter: this.adapterId,
        airtableRecordId: chosen.record.id,
        rawFields: chosen.record.fields,
        originalRow: chosen.row,
      },
    };
  }
}

/** Default Airtable adapter instance for factory registration. */
export const airtableAdapter = new AirtableSupplierAdapter();