import pg from 'pg';
import type { PoolClient } from 'pg';
import { validateEnv } from '../env';

const { Pool } = pg;

// Run security gates and environment validations on startup
validateEnv();

/**
 * PostgreSQL Database Client
 *
 * Single shared connection pool for the application.
 * Uses DATABASE_URL from environment (required from day one — Blueprint §3.3).
 *
 * Migrations runner: `npm run db:migrate` → src/db/migrate.ts (implemented).
 *
 * TODO: @agent:archivist Add connection pool monitoring / health check integration
 * TODO: @agent:archivist Configure max connections based on worker + web concurrency
 *
 * @agent:atlas Use `db` pool in API route handlers for all database queries
 */

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is required. Copy .env.example → .env and set your database URL.',
  );
}

/** Shared PostgreSQL connection pool */
export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  // TODO: @agent:archivist Tune pool size: max = (web_concurrency + worker_concurrency) * 2
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

/**
 * Well-known seeded dev tenant UUID (migration 0003).
 * @agent:forge/atlas Replace with the authenticated session's tenant UUID once
 * auth (next-auth) is wired in Stage 2.
 */
export const DEV_TENANT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Set the active tenant for the current transaction via the `ghostcart.tenant_id`
 * GUC that the RLS policies (migration 0003) read. Using `is_local = true`
 * automatically resets the value when the enclosing transaction ends — preventing
 * tenant bleed across pooled connections.
 *
 * Must be called inside a transaction:
 *   const client = await db.connect();
 *   await client.query('BEGIN');
 *   await setTenantContextOn(client, tenantId);
 *   ... tenant-scoped queries ...
 *   await client.query('COMMIT');
 */
export async function setTenantContextOn(
  client: PoolClient,
  tenantId: string,
): Promise<void> {
  await client.query('SELECT set_config($1, $2, true)', [
    'ghostcart.tenant_id',
    tenantId,
  ]);
}

/**
 * Convenience wrapper: opens a transaction, scopes the tenant context to it,
 * runs `work(client)`, then commits. Rolls back and rethrows on error.
 */
export async function withTenant<T>(
  tenantId: string,
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await setTenantContextOn(client, tenantId);
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

/** Graceful shutdown — drain pool on process exit */
process.on('SIGTERM', () => {
  db.end().catch((err: Error) => console.error('Error closing DB pool:', err));
});

