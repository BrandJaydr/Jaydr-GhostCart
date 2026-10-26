import type { ISupplierAdapter } from './supplier.interface';
import type { CanonicalProduct } from '@/lib/types/canonical';
import { parseCsv, normalizeCsvRow, REQUIRED_CSV_KEYS, validateCsv } from './normalize';

/**
 * CsvSupplierAdapter — Stage 2 real, authorized supplier adapter
 *
 * Implements ISupplierAdapter over a user-provided CSV feed (a public URL or a
 * data: URI). This is the first real adapter replacing the mock, per Stage 2
 * ("one authorized supplier/catalog adapter — user-provided CSV").
 *
 * IMPORTANT BOUNDARIES (Forge/Atlas rules):
 *   • Vendor/feed payloads are normalized to CanonicalProduct here — never in
 *     components or API routes.
 *   • Raw source metadata (original row) is preserved for traceability.
 *   • No network in unit tests: pass a `fetcher` to the constructor, or subclass
 *     and override `loadCsv`.
 */
export class CsvSupplierAdapter implements ISupplierAdapter {
  readonly adapterId = 'csv';

  private readonly fetcher: (url: string) => Promise<string>;

  constructor(fetcher?: (url: string) => Promise<string>) {
    this.fetcher =
      fetcher ??
      (async (url: string) => {
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`CSV feed returned HTTP ${res.status}`);
        }
        return res.text();
      });
  }

  /** Load the raw CSV text for a feed URL. */
  async loadCsv(url: string): Promise<string> {
    return this.fetcher(url);
  }

  async validateConnection(): Promise<{ valid: boolean; reason?: string; details?: any }> {
    const feedUrl = process.env.CSV_FEED_URL;
    if (!feedUrl) {
      return { valid: false, reason: 'CSV_FEED_URL is not configured' };
    }
    try {
      const text = await this.loadCsv(feedUrl);
      const validation = validateCsv(text, REQUIRED_CSV_KEYS);
      
      if (!validation.isValid) {
        const errorMessages = validation.errors.map(e => 
          e.line ? `Line ${e.line}: ${e.message}` : e.message
        ).join('; ');
        return { 
          valid: false, 
          reason: `CSV validation failed: ${errorMessages}`,
          details: validation
        };
      }
      
      if (validation.warnings.length > 0) {
        const warningMessages = validation.warnings.map(w => 
          w.line ? `Line ${w.line}: ${w.message}` : w.message
        ).join('; ');
        return { 
          valid: true, 
          reason: `CSV validated with warnings: ${warningMessages}`,
          details: validation
        };
      }
      
      return { valid: true, reason: 'CSV feed is valid' };
    } catch (err) {
      return { valid: false, reason: (err as Error).message };
    }
  }

  /** Pick the row for a given source URL, or the feed's first row as a fallback. */
  private pickRow(text: string, sourceUrl: string | null): Record<string, string> | null {
    const rows = parseCsv(text);
    if (rows.length === 0) return null;
    if (sourceUrl) {
      const match = rows.find((r) => (r.source_url ?? '').trim() === sourceUrl.trim());
      if (match) return match;
    }
    return rows[0];
  }

  async importProduct(url: string, tenantId: string): Promise<CanonicalProduct> {
    const text = await this.loadCsv(url);
    const row = this.pickRow(text, url);
    if (!row) {
      throw new Error('CSV feed contains no product rows');
    }
    const sourceUrl = (row.source_url ?? '').trim() || url;
    return normalizeCsvRow(row, tenantId, this.adapterId, sourceUrl);
  }

  async fetchProduct(productId: string, tenantId: string): Promise<CanonicalProduct> {
    const feed = process.env.CSV_FEED_URL;
    if (!feed) {
      throw new Error('CSV_FEED_URL is not configured');
    }
    const text = await this.loadCsv(feed);
    const rows = parseCsv(text);
    // Recompute the deterministic id the same way normalizeCsvRow does.
    const match = rows.find((r) => {
      const sourceUrl = (r.source_url ?? '').trim();
      const id = `product_${Buffer.from(sourceUrl).toString('base64url').slice(0, 12)}`;
      return id === productId;
    });
    if (!match) {
      return normalizeCsvRow(rows[0], tenantId, this.adapterId, (rows[0].source_url ?? '').trim() || feed);
    }
    const sourceUrl = (match.source_url ?? '').trim() || feed;
    return normalizeCsvRow(match, tenantId, this.adapterId, sourceUrl);
  }
}

/** Default CSV adapter instance for factory registration. */
export const csvAdapter = new CsvSupplierAdapter();
