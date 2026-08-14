import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { withTenant, DEV_TENANT_ID } from '@/lib/db/index';
import type { CorrectionEntry } from '@/lib/types/canonical';

/**
 * PATCH /api/products/[id]/corrections
 *
 * Record a merchant manual correction for a product field.
 *
 * Body: { [field]: correctedValue }
 *
 * - Stores the original value in `products.user_corrections` JSONB if not already
 *   present for that field.
 * - Updates the corresponding product column.
 * - Emits an `product.corrected` audit event.
 *
 * Reference: Production Blueprint Â§6.1 (audit trail)
 */

type CorrectionBody = Record<string, unknown>;

const EDITABLE_FIELDS = new Set([
  'title',
  'description',
  'supplier_price_cents',
  'currency',
  'availability',
  'primary_image_url',
  'additional_image_urls',
  'identifiers',
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const productId = params.id;

  let body: CorrectionBody;
  try {
    body = (await req.json()) as CorrectionBody;
  } catch {
    return apiError('Invalid JSON request body', null, 400);
  }

  const fields = Object.keys(body);
  if (fields.length === 0) {
    return apiError('No corrections provided', null, 400);
  }

  const invalid = fields.filter((f) => !EDITABLE_FIELDS.has(f));
  if (invalid.length > 0) {
    return apiError(
      'Non-editable fields',
      { fields: invalid },
      400,
    );
  }

  let result;
  try {
    result = await withTenant<{ corrected: boolean; fields: string[] }>(
      DEV_TENANT_ID,
      async (client) => {
        await client.query('BEGIN');

        // Fetch current product within tenant scope.
        const productRes = await client.query(
          'SELECT id, user_corrections FROM products WHERE id = $1 LIMIT 1',
          [productId],
        );
        if (productRes.rowCount === 0) {
          await client.query('ROLLBACK');
          throw new Error('NOT_FOUND');
        }

        const currentCorrections = (productRes.rows[0].user_corrections ?? {}) as Record<
          string,
          CorrectionEntry
        >;

        const setClauses: string[] = [];
        const values: unknown[] = [productId];
        let idx = 2;

        const auditMetadata: Record<string, { original: unknown; corrected: unknown }> = {};

        for (const field of fields) {
          const column = field;
          const newValue = body[field];

          // Preserve original if not already corrected.
          if (!(field in currentCorrections)) {
            const originalRes = await client.query(
              `SELECT ${column} AS original FROM products WHERE id = $1`,
              [productId],
            );
            currentCorrections[field] = {
              original: originalRes.rows[0]?.original,
              corrected: newValue,
              correctedAt: new Date().toISOString(),
              correctedBy: DEV_TENANT_ID,
            };
            auditMetadata[field] = {
              original: originalRes.rows[0]?.original,
              corrected: newValue,
            };
          } else {
            auditMetadata[field] = {
              original: currentCorrections[field].original,
              corrected: newValue,
            };
            currentCorrections[field].corrected = newValue;
            currentCorrections[field].correctedAt = new Date().toISOString();
          }

          setClauses.push(`${column} = $${idx}`);
          values.push(newValue);
          idx += 1;
        }

        setClauses.push(`user_corrections = $${idx}`);
        values.push(JSON.stringify(currentCorrections));
        idx += 1;

        const sql = `UPDATE products SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`;
        await client.query(sql, values);

        // Audit event.
        await client.query(
          `INSERT INTO audit_events
              (tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
            VALUES ($1, NULL, 'product.corrected', 'products', $2, $3, now())`,
          [DEV_TENANT_ID, productId, JSON.stringify(auditMetadata)],
        );

        await client.query('COMMIT');
        return { corrected: true, fields };
      },
    );
  } catch (err) {
    if ((err as Error).message === 'NOT_FOUND') {
      return apiError('Product not found', null, 404);
    }
    console.error('[api/products/corrections]', err);
    return apiError('Failed to apply corrections', null, 500);
  }

    return apiSuccess(result, undefined, 200);
}
