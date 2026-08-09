/* eslint-disable no-console */
/**
 * PostgreSQL Migration Runner — Jaydr GhostCart
 *
 * Applies `.sql` files from `src/db/migrations/` in filename order, exactly once,
 * tracking each in a `schema_migrations` table. Runs each migration inside a
 * transaction so a failure rolls back cleanly.
 *
 * Usage:
 *   npm run db:migrate          # apply pending migrations
 *
 * Requires DATABASE_URL (see .env.example). Self-contained: only `node:` and `pg`
 * imports so it runs under `ts-node --esm` with no path/alias resolution issues.
 *
 * Rollback / recovery:
 *   - Migrations are additive and (should be) idempotent; they never drop data.
 *   - To roll back a not-yet-deployed migration, remove its row from
 *     `schema_migrations` AFTER writing a compensating DOWN migration, then
 *     re-run. Full procedure: see TECHNICAL_WIKI "DB & Migrations" (§12.4) and
 *     Docs "Rollback & Recovery" notes.
 *
 * @agent:atlas/forge: set `ghostcart.tenant_id` session GUC per request so the
 * tenant-scoped RLS policies (migration 0003) resolve the active tenant.
 */
import pg from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Client } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const MIGRATIONS_TABLE = 'schema_migrations';

function exit(message: string, code = 1): never {
  console.error(message);
  process.exit(code);
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    exit(
      'DATABASE_URL environment variable is required. Copy .env.example → .env and set your database URL.',
    );
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    // Tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
        name        TEXT PRIMARY KEY,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const { rows } = await client.query<{ name: string }>(
      `SELECT name FROM ${MIGRATIONS_TABLE}`,
    );
    const applied = new Set(rows.map((r) => r.name));

    if (files.length === 0) {
      exit(`No migrations found in ${MIGRATIONS_DIR}`, 0);
    }

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) continue;

      const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      process.stdout.write(`Applying ${file} ... `);

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1)`,
          [file],
        );
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
      console.log('ok');
      count += 1;
    }

    if (count === 0) {
      console.log('Database is up to date.');
    } else {
      console.log(`Applied ${count} migration(s):`);
      for (const file of files) {
        console.log(`  - ${file} ${applied.has(file) ? '(already applied)' : '(new)'}`);
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('\nMigration failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
