import { Pool } from 'pg';

/**
 * PostgreSQL Database Client — Stage 1 Stub
 *
 * Single shared connection pool for the application.
 * Uses DATABASE_URL from environment (required from day one — Blueprint §3.3).
 *
 * TODO: @agent:archivist Implement migrations runner (pg-migrate or raw SQL runner)
 * TODO: @agent:archivist Add connection pool monitoring / health check integration
 * TODO: @agent:archivist Configure max connections based on worker + web concurrency
 * TODO: @agent:archivist Add query helper with tenant_id injection for all tenant-scoped tables
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

/** Graceful shutdown — drain pool on process exit */
process.on('SIGTERM', () => {
  db.end().catch((err: Error) => console.error('Error closing DB pool:', err));
});
