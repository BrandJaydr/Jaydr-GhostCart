import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { db, withTenant } from '@/lib/db/index';

describe('Tenancy Isolation Integration Tests', () => {
  const tenantA = '00000000-0000-0000-0000-00000000000a';
  const tenantB = '00000000-0000-0000-0000-00000000000b';
  const userA = '00000000-0000-0000-0000-00000000001a';
  const userB = '00000000-0000-0000-0000-00000000001b';

  beforeEach(async () => {
    // Clean up if previous run crashed
    await db.query('DELETE FROM feedback WHERE tenant_id IN ($1, $2)', [tenantA, tenantB]);
    await db.query('DELETE FROM alert_events WHERE tenant_id IN ($1, $2)', [tenantA, tenantB]);
    await db.query('DELETE FROM users WHERE id IN ($1, $2)', [userA, userB]);
    await db.query('DELETE FROM tenants WHERE id IN ($1, $2)', [tenantA, tenantB]);

    // Insert test tenants using the owner connection (which bypasses RLS/restrictions)
    await db.query(
      `INSERT INTO tenants (id, name, billing_plan)
       VALUES 
         ($1, 'Tenant A', 'pilot'),
         ($2, 'Tenant B', 'pilot')`,
      [tenantA, tenantB]
    );

    // Insert test users belonging to each tenant
    await db.query(
      `INSERT INTO users (id, tenant_id, email, role)
       VALUES 
         ($1, $2, 'userA@test.local', 'owner'),
         ($3, $4, 'userB@test.local', 'owner')`,
      [userA, tenantA, userB, tenantB]
    );
  });

  afterEach(async () => {
    // Clean up test data
    await db.query('DELETE FROM feedback WHERE tenant_id IN ($1, $2)', [tenantA, tenantB]);
    await db.query('DELETE FROM alert_events WHERE tenant_id IN ($1, $2)', [tenantA, tenantB]);
    await db.query('DELETE FROM users WHERE id IN ($1, $2)', [userA, userB]);
    await db.query('DELETE FROM tenants WHERE id IN ($1, $2)', [tenantA, tenantB]);
  });

  describe('GUC Scoping with withTenant()', () => {
    it('isolates writes and reads between tenants', async () => {
      // 1. Insert feedback for Tenant A under Tenant A context with RLS active
      await withTenant(tenantA, async (client) => {
        await client.query('SET LOCAL ROLE ghostcart_app');
        await client.query(
          `INSERT INTO feedback (tenant_id, user_id, category, title, description, status)
           VALUES ($1, $2, 'bug', 'Feedback A', 'Description A', 'new')`,
          [tenantA, userA]
        );
      });

      // 2. Insert feedback for Tenant B under Tenant B context with RLS active
      await withTenant(tenantB, async (client) => {
        await client.query('SET LOCAL ROLE ghostcart_app');
        await client.query(
          `INSERT INTO feedback (tenant_id, user_id, category, title, description, status)
           VALUES ($1, $2, 'feature_request', 'Feedback B', 'Description B', 'new')`,
          [tenantB, userB]
        );
      });

      // 3. Query under Tenant A context - should only see Feedback A
      await withTenant(tenantA, async (client) => {
        await client.query('SET LOCAL ROLE ghostcart_app');
        const result = await client.query('SELECT title FROM feedback');
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].title).toBe('Feedback A');
      });

      // 4. Query under Tenant B context - should only see Feedback B
      await withTenant(tenantB, async (client) => {
        await client.query('SET LOCAL ROLE ghostcart_app');
        const result = await client.query('SELECT title FROM feedback');
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].title).toBe('Feedback B');
      });
    });
  });

  describe('PostgreSQL Row-Level Security (RLS) enforcement', () => {
    it('enforces RLS for least-privilege role ghostcart_app', async () => {
      // Connect as owner to insert data
      await db.query(
        `INSERT INTO feedback (tenant_id, user_id, category, title, description, status)
         VALUES 
           ($1, $2, 'bug', 'Feedback A', 'Description A', 'new'),
           ($3, $4, 'feature_request', 'Feedback B', 'Description B', 'new')`,
        [tenantA, userA, tenantB, userB]
      );

      // Now create a client, switch role to ghostcart_app
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        await client.query('SET LOCAL ROLE ghostcart_app');

        // Without setting a valid GUC context (use dummy UUID to avoid UUID empty string cast error),
        // RLS should block all reads (secure default)
        await client.query("SELECT set_config('ghostcart.tenant_id', '00000000-0000-0000-0000-000000000000', true)");
        const uncontextedResult = await client.query('SELECT * FROM feedback');
        expect(uncontextedResult.rows).toHaveLength(0);

        // Setting GUC context for Tenant A should allow reading Tenant A data only
        await client.query("SELECT set_config('ghostcart.tenant_id', $1, true)", [tenantA]);
        const tenantAResult = await client.query('SELECT title FROM feedback');
        expect(tenantAResult.rows).toHaveLength(1);
        expect(tenantAResult.rows[0].title).toBe('Feedback A');

        // Trying to insert Tenant B data under Tenant A context should fail policy check
        await expect(
          client.query(
            `INSERT INTO feedback (tenant_id, user_id, category, title, description, status)
             VALUES ($1, $2, 'bug', 'Hack Title', 'Hack Desc', 'new')`,
            [tenantB, userB]
          )
        ).rejects.toThrow(/new row violates row-level security policy/);

        await client.query('ROLLBACK');
      } finally {
        client.release();
      }
    });
  });

  describe('alert_events Row-Level Security (RLS) enforcement', () => {
    it('enforces RLS on alert_events for ghostcart_app role', async () => {
      // Connect as owner to insert alert data
      await db.query(
        `INSERT INTO alert_events (tenant_id, alert_type, severity, message, status)
         VALUES 
           ($1, 'import_failed', 'critical', 'Alert A', 'new'),
           ($2, 'sync_warning', 'warning', 'Alert B', 'new')`,
        [tenantA, tenantB]
      );

      const client = await db.connect();
      try {
        await client.query('BEGIN');
        await client.query('SET LOCAL ROLE ghostcart_app');

        // Without GUC, reads should return empty rows
        await client.query("SELECT set_config('ghostcart.tenant_id', '00000000-0000-0000-0000-000000000000', true)");
        const uncontextedResult = await client.query('SELECT * FROM alert_events');
        expect(uncontextedResult.rows).toHaveLength(0);

        // Under Tenant A GUC, should only see Alert A
        await client.query("SELECT set_config('ghostcart.tenant_id', $1, true)", [tenantA]);
        const tenantAResult = await client.query('SELECT message FROM alert_events');
        expect(tenantAResult.rows).toHaveLength(1);
        expect(tenantAResult.rows[0].message).toBe('Alert A');

        // Attempting to insert Tenant B alert under Tenant A context should fail policy check
        await client.query('SAVEPOINT sp1');
        await expect(
          client.query(
            `INSERT INTO alert_events (tenant_id, alert_type, severity, message, status)
             VALUES ($1, 'sync_warning', 'warning', 'Hack Alert', 'new')`,
            [tenantB]
          )
        ).rejects.toThrow(/new row violates row-level security policy/);
        await client.query('ROLLBACK TO SAVEPOINT sp1');

        // Attempting to update Tenant B alert under Tenant A context should affect 0 rows
        const updateResult = await client.query(
          `UPDATE alert_events SET status = 'acknowledged' WHERE tenant_id = $1`,
          [tenantB]
        );
        expect(updateResult.rowCount).toBe(0);

        await client.query('ROLLBACK');
      } finally {
        client.release();
      }
    });
  });

  afterAll(async () => {
    await db.end();
  });
});
