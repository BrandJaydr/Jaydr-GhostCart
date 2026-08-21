import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { withTenant } from '@/lib/db';
import { withAuthRoute, requirePermission, Permission } from '@/lib/middleware/auth-guard';

/**
 * GET /api/suppliers
 *
 * List the authenticated tenant's registered supplier connections
 * (id, adapterId, name, config). Lets the import UI resolve a valid
 * supplier UUID to send as `supplierId` in POST /api/products.
 *
 * @agent:investigator Fix 1 (ERR-022) - ImportForm could not send a valid
 * supplierId (a suppliers-row UUID) because no suppliers endpoint existed.
 * This minimal read endpoint unblocks a contract-aligned import. Extend into
 * /api/settings for supplier CRUD / signup later (Fix 3c).
 */
export const GET = withAuthRoute(async (req: NextRequest, actor) => {
  await requirePermission(actor, Permission.SETTINGS_READ);
  const tenantId = actor.tenantId;

  try {
    const result = await withTenant(tenantId, (tx) =>
      tx.query(
        `SELECT id, adapter_id, name, config
           FROM suppliers
          WHERE tenant_id = $1
          ORDER BY name ASC`,
        [tenantId],
      ),
    );

    const suppliers = result.rows.map((row) => ({
      id: row.id,
      adapterId: row.adapter_id,
      name: row.name,
      config: row.config ?? {},
    }));

    return apiSuccess(suppliers);
  } catch (err) {
    // @agent:investigator SEC-007 - route through structured logger (logger.ts)
    // instead of raw console.error during the logging-migration (Fix 4).
    console.error('[api/suppliers] GET error:', (err as Error).message);
    return apiError('Failed to fetch suppliers', null, 500);
  }
});