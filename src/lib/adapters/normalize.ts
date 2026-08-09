/**
 * Adapter Normalization Helpers — Stage 2
 *
 * Pure functions shared by adapters (and unit-tested in isolation) to normalize
 * raw supplier payloads into a CanonicalProduct with per-field confidence scoring.
 *
 * Reference: Production Blueprint §6.2 (adapter contract) — vendor payloads must
 * NEVER leak into the application layer; everything funnels through CanonicalProduct.
 */
import type { CanonicalProduct, FieldConfidence } from '@/lib/types/canonical';

/** Parse a well-formed CSV string into an array of row objects (header row → keys). */
export function parseCsv(text: string): Record<string, string>[] {
  const rows = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (rows.length === 0) return [];

  const [header, ...body] = rows;
  const keys = splitCsvLine(header).map((k) => k.trim());

  return body
    .map((line) => {
      const values = splitCsvLine(line).map((v) => v.trim());
      const row: Record<string, string> = {};
      keys.forEach((key, i) => {
        row[key] = values[i] ?? '';
      });
      return row;
    })
    .filter((row) => Object.values(row).some((v) => v.length > 0));
}

/** Minimal CSV line splitter (handles quoted fields with embedded commas). */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      out.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out;
}

/** Coerce a parsed price string ("$29.99", "29.99", "2,999") into minor units. */
export function priceToMinorUnits(value: string | undefined): number | null {
  if (value === undefined || value === null || value.trim() === '') return null;
  const cleaned = value.replace(/[^0-9.]/g, '');
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

/** Map a supplier availability word to the canonical union. */
export function normalizeAvailability(value: string | undefined): CanonicalProduct['availability'] {
  const v = (value ?? '').toLowerCase();
  if (v.includes('in stock') || v === 'in_stock' || v === 'yes' || v === 'available') return 'in_stock';
  if (v.includes('out of stock') || v === 'out_of_stock' || v === 'no' || v === 'sold out') return 'out_of_stock';
  if (v.includes('limited') || v === 'limited' || v === 'low stock') return 'limited';
  return 'unknown';
}

/** Score completeness of each required field → FieldConfidence with warnings. */
export function scoreCsvRow(
  row: Record<string, string>,
  requiredKeys: string[],
): FieldConfidence[] {
  const required = requiredKeys.filter((k) => {
    const v = (row[k] ?? '').trim();
    return v.length > 0;
  }).length;

  return [
    { field: 'title', score: 1, warnings: [] },
    {
      field: 'description',
      score: (row.description ?? '').trim().length > 0 ? 1 : 0.4,
      warnings:
        (row.description ?? '').trim().length === 0
          ? ['Missing description']
          : [],
    },
    {
      field: 'primary_image_url',
      score: (row.primary_image_url ?? '').trim().length > 0 ? 1 : 0,
      warnings: (row.primary_image_url ?? '').trim().length === 0 ? ['No image provided'] : [],
    },
    {
      field: 'availability',
      score: normalizeAvailability(row.availability) !== 'unknown' ? 1 : 0.6,
      warnings: normalizeAvailability(row.availability) === 'unknown' ? ['Availability unknown'] : [],
    },
    {
      field: 'identifiers',
      score: (row.sku ?? row.gtin ?? row.upc ?? '').trim().length > 0 ? 1 : 0.4,
      warnings: (row.sku ?? row.gtin ?? row.upc ?? '').trim().length === 0 ? ['No SKU/identifier'] : [],
    },
    {
      field: 'required',
      score: required / requiredKeys.length,
      warnings: required < requiredKeys.length ? ['Some required fields missing'] : [],
    },
  ];
}

/** Required CSV columns; used by the adapter to detect malformed feeds. */
export const REQUIRED_CSV_KEYS = [
  'title',
  'description',
  'supplier_price_cents',
  'currency',
  'availability',
  'source_url',
];

/** Build a CanonicalProduct from one CSV row (see csv.adapter.ts). */
export function normalizeCsvRow(
  row: Record<string, string>,
  tenantId: string,
  supplierId: string,
  sourceUrl: string,
): CanonicalProduct {
  const price = priceToMinorUnits(row.supplier_price_cents ?? row.price);
  const confidence = scoreCsvRow(row, REQUIRED_CSV_KEYS);

  return {
    id: `product_${Buffer.from(sourceUrl).toString('base64url').slice(0, 12)}`,
    tenantId,
    title: (row.title ?? '').trim(),
    description: (row.description ?? '').trim(),
    identifiers: {
      ...(row.sku ? { sku: row.sku.trim() } : {}),
      ...(row.gtin ? { gtin: row.gtin.trim() } : {}),
      ...(row.upc ? { upc: row.upc.trim() } : {}),
    },
    primaryImageUrl: (row.primary_image_url ?? '').trim() || null,
    additionalImageUrls: (row.additional_image_urls ?? '')
      .split('|')
      .map((u) => u.trim())
      .filter(Boolean),
    supplierPriceCents: price ?? 0,
    currency: (row.currency ?? 'USD').trim().toUpperCase(),
    availability: normalizeAvailability(row.availability),
    sourceUrl: sourceUrl,
    supplierId,
    rawSourceMetadata: {
      adapter: 'csv',
      originalRow: row,
    },
    confidence,
    importedAt: new Date().toISOString(),
    lastRefreshedAt: null,
  };
}