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

export interface ValidationError {
  line?: number;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

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

/** Validate URL format */
export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Validate currency code (ISO 4217) */
export function isValidCurrency(value: string): boolean {
  const validCurrencies = new Set(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY']);
  return validCurrencies.has(value.toUpperCase());
}

/** Validate price format */
export function isValidPrice(value: string): boolean {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 && cleaned !== '';
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

/** Validate CSV structure and content */
export function validateCsv(text: string, requiredKeys: string[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const lines = text.split(/\r?\n/).map((l) => l.trim());
  if (lines.length === 0) {
    errors.push({ message: 'CSV file is empty', severity: 'error' });
    return { isValid: false, errors, warnings };
  }

  const [header, ...body] = lines;
  const keys = splitCsvLine(header).map((k) => k.trim());

  // Check for required columns
  const missingKeys = requiredKeys.filter((k) => !keys.includes(k));
  if (missingKeys.length > 0) {
    errors.push({
      line: 1,
      message: `Missing required columns: ${missingKeys.join(', ')}`,
      severity: 'error',
    });
  }

  // Validate each row
  body.forEach((line, idx) => {
    const lineNum = idx + 2; // +2 because header is line 1
    const values = splitCsvLine(line);

    if (values.length !== keys.length) {
      warnings.push({
        line: lineNum,
        message: `Column count mismatch: expected ${keys.length}, got ${values.length}`,
        severity: 'warning',
      });
    }

    const row: Record<string, string> = {};
    keys.forEach((key, i) => {
      row[key] = values[i] ?? '';
    });

    // Validate URL fields
    if (row.source_url && !isValidUrl(row.source_url)) {
      errors.push({
        line: lineNum,
        field: 'source_url',
        message: `Invalid URL format: ${row.source_url}`,
        severity: 'error',
      });
    }

    if (row.primary_image_url && !isValidUrl(row.primary_image_url)) {
      warnings.push({
        line: lineNum,
        field: 'primary_image_url',
        message: `Invalid image URL format: ${row.primary_image_url}`,
        severity: 'warning',
      });
    }

    // Validate price
    if (row.supplier_price_cents && !isValidPrice(row.supplier_price_cents)) {
      errors.push({
        line: lineNum,
        field: 'supplier_price_cents',
        message: `Invalid price format: ${row.supplier_price_cents}`,
        severity: 'error',
      });
    }

    // Validate currency
    if (row.currency && !isValidCurrency(row.currency)) {
      warnings.push({
        line: lineNum,
        field: 'currency',
        message: `Non-standard currency code: ${row.currency}`,
        severity: 'warning',
      });
    }

    // Check for empty required fields
    requiredKeys.forEach((key) => {
      if (!row[key] || row[key].trim() === '') {
        errors.push({
          line: lineNum,
          field: key,
          message: `Required field '${key}' is empty`,
          severity: 'error',
        });
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
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

  const warnings: string[] = [];
  if (required < requiredKeys.length) {
    const missing = requiredKeys.filter((k) => !(row[k] ?? '').trim());
    warnings.push(`Missing required fields: ${missing.join(', ')}`);
  }

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
      warnings,
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