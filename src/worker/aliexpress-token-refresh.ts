/**
 * Scheduled AliExpress token refresh — GC-303.
 *
 * Rotates expiring AliExpress Open Platform tokens through the GC-202 token
 * provider and persists the rotated pair. A refresh failure raises one alert
 * event and is contained to that connection: it never escapes into the worker
 * tick, so a bad connection cannot crash the process or spin a retry loop.
 *
 * No credential or token material is written to logs or alert payloads.
 */

import { db } from '../lib/db/index.js';
import { notify, type AlertEvent } from '../lib/alerts/index.js';
import {
  AliExpressTokenError,
  AliExpressTokenProvider,
} from '../lib/adapters/aliexpress/token.js';

/** Tick cadence for the token-refresh sweep (GC-303). */
export const ALIEXPRESS_TOKEN_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

/** Five minutes — matches migration 0006's needs_token_refresh(connection_id). */
export const TOKEN_REFRESH_SKEW_MS = 5 * 60 * 1000;

export interface AliExpressTokenConnectionRow {
  id: string;
  tenant_id: string;
  access_token: string | null;
  refresh_token: string;
  token_expires_at: Date | null;
}

export interface TokenRefreshOutcome {
  connectionId: string;
  tenantId: string;
  status: 'refreshed' | 'failed';
}

export interface TokenRefreshOptions {
  queryClient?: { query: typeof db.query };
  provider?: Pick<AliExpressTokenProvider, 'getValidToken'>;
  notifier?: (event: AlertEvent) => Promise<string | null>;
}

const DUE_CONNECTIONS_SQL = `
SELECT id, tenant_id, access_token, refresh_token, token_expires_at
FROM marketplace_connections
WHERE marketplace = 'aliexpress'
  AND disabled_at IS NULL
  AND refresh_token IS NOT NULL
  AND (token_expires_at IS NULL OR token_expires_at <= now() + interval '5 minutes')
ORDER BY connected_at ASC`;

const PERSIST_TOKENS_SQL = `
UPDATE marketplace_connections
SET access_token = $2, refresh_token = $3, token_expires_at = $4
WHERE id = $1 AND tenant_id = $5`;

/**
 * Refresh every AliExpress connection whose access token is expired or within
 * the refresh skew. Each failure is alerted and skipped; the sweep resolves.
 */
export async function processAliExpressTokenRefreshes(
  options: TokenRefreshOptions = {},
): Promise<TokenRefreshOutcome[]> {
  const queryClient = options.queryClient ?? db;
  const notifier = options.notifier ?? notify;
  const provider =
    options.provider ?? new AliExpressTokenProvider();
  const outcomes: TokenRefreshOutcome[] = [];

  const due = await queryClient.query<AliExpressTokenConnectionRow>(
    DUE_CONNECTIONS_SQL,
  );

  for (const row of due.rows) {
    try {
      const rotated = await provider.getValidToken({
        accessToken: row.access_token ?? '',
        refreshToken: row.refresh_token,
        expiresAt: row.token_expires_at ?? null,
      });

      await queryClient.query(PERSIST_TOKENS_SQL, [
        row.id,
        rotated.accessToken,
        rotated.refreshToken,
        rotated.expiresAt,
        row.tenant_id,
      ]);

      outcomes.push({
        connectionId: row.id,
        tenantId: row.tenant_id,
        status: 'refreshed',
      });
    } catch (error) {
      outcomes.push({
        connectionId: row.id,
        tenantId: row.tenant_id,
        status: 'failed',
      });

      const kind =
        error instanceof AliExpressTokenError ? error.kind : 'unknown';
      try {
        await notifier({
          tenantId: row.tenant_id,
          alertType: 'aliexpress.token_refresh_failed',
          severity: 'critical',
          message: `AliExpress token refresh failed for connection ${row.id}`,
          payload: {
            connectionId: row.id,
            marketplace: 'aliexpress',
            errorKind: kind,
          },
        });
      } catch (alertError) {
        console.error(
          '[AliExpress token refresh] could not raise alert:',
          (alertError as Error).message,
        );
      }
    }
  }

  return outcomes;
}
