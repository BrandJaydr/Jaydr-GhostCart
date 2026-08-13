import type { NextRequest } from 'next/server';
import { apiError } from '@/lib/api/response';
import { db, DEV_TENANT_ID } from '@/lib/db/index';

/**
 * GET /api/ebay/export/csv
 * Export listings to eBay-compatible CSV format
 */
export async function GET(req: NextRequest) {
  const tenantId = DEV_TENANT_ID;

  try {
    const result = await db.query(
      `SELECT title, description, list_price_cents, currency, image_urls
       FROM listings WHERE tenant_id = $1`,
      [tenantId],
    );

    const csv = [
      '*Title', 'Description', 'Price', 'Currency', 'ImageURLs',
      ...result.rows.map((row) =>
        `"${row.title}","${row.description}",${row.list_price_cents},${row.currency},"${row.image_urls?.join(',') || ''}"`,
      ),
    ].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=ebay_export.csv',
      },
    });
  } catch (err) {
    console.error('[api/ebay/export/csv] Error:', err);
    return apiError('Failed to export CSV', null, 500);
  }
}
