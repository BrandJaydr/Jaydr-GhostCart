import { describe, it, expect } from 'vitest';
import {
  parseCsv,
  normalizeCsvRow,
  priceToMinorUnits,
  normalizeAvailability,
  REQUIRED_CSV_KEYS,
} from '@/lib/adapters/normalize';
import { CsvSupplierAdapter } from '@/lib/adapters/csv.adapter';
import { listSupplierAdapters } from '@/lib/adapters/factory';

const CSV =
  [
    'title,description,supplier_price_cents,currency,availability,source_url,sku,primary_image_url',
    'Wireless Mouse,Ergonomic mouse,$29.99,USD,in_stock,https://feed.example/p1,SKU-001,https://img.example/mouse.png',
    'Keyboard,Mechanical keyboard,4999,USD,out_of_stock,https://feed.example/p2,SKU-002,',
  ].join('\n') + '\n';

describe('normalize.ts CSV helpers', () => {
  it('parses CSV into row objects keyed by the header row', () => {
    const rows = parseCsv(CSV);
    expect(rows).toHaveLength(2);
    expect(rows[0].title).toBe('Wireless Mouse');
    expect(rows[0].source_url).toBe('https://feed.example/p1');
  });

  it('converts a "$29.99" price string into 2999 minor units', () => {
    expect(priceToMinorUnits('$29.99')).toBe(2999);
    expect(priceToMinorUnits('4999')).toBe(499900);
    expect(priceToMinorUnits('')).toBeNull();
    expect(priceToMinorUnits('nope')).toBeNull();
  });

  it('maps availability words to the canonical union', () => {
    expect(normalizeAvailability('in_stock')).toBe('in_stock');
    expect(normalizeAvailability('sold out')).toBe('out_of_stock');
    expect(normalizeAvailability('low stock')).toBe('limited');
    expect(normalizeAvailability('')).toBe('unknown');
  });

  it('builds a CanonicalProduct with identifiers, price and traceability metadata', () => {
    const product = normalizeCsvRow(
      {
        title: 'Wireless Mouse',
        description: 'Ergonomic mouse',
        supplier_price_cents: '$29.99',
        currency: 'USD',
        availability: 'in_stock',
        source_url: 'https://feed.example/p1',
        sku: 'SKU-001',
        primary_image_url: 'https://img.example/mouse.png',
      },
      'tenant-1',
      'csv',
      'https://feed.example/p1',
    );
    expect(product.supplierId).toBe('csv');
    expect(product.tenantId).toBe('tenant-1');
    expect(product.supplierPriceCents).toBe(2999);
    expect(product.identifiers.sku).toBe('SKU-001');
    expect(product.rawSourceMetadata.adapter).toBe('csv');
    expect(product.confidence.length).toBeGreaterThan(0);
    expect(typeof product.importedAt).toBe('string');
  });

  it('flags missing images in confidence warnings', () => {
    const product = normalizeCsvRow(
      { title: 'No Img', source_url: 'https://feed.example/none' },
      'tenant-1',
      'csv',
      'https://feed.example/none',
    );
    const imageField = product.confidence.find((c) => c.field === 'primary_image_url');
    expect(imageField?.score).toBe(0);
    expect(imageField?.warnings).toContain('No image provided');
  });
});

describe('CsvSupplierAdapter (stubbed fetcher, no network)', () => {
  function adapterFor(text: string) {
    return new CsvSupplierAdapter(async () => text);
  }

  it('imports the row matching the requested source URL', async () => {
    const adapter = adapterFor(CSV);
    const product = await adapter.importProduct('https://feed.example/p2', 'tenant-1');
    expect(product.title).toBe('Keyboard');
    expect(product.sourceUrl).toBe('https://feed.example/p2');
  });

  it('throws when the feed has no rows', async () => {
    const adapter = adapterFor('title\n');
    await expect(adapter.importProduct('https://feed.example/x', 'tenant-1')).rejects.toThrow();
  });

  it('validateConnection reports valid for a correctly-shaped feed', async () => {
    const prev = process.env.CSV_FEED_URL;
    process.env.CSV_FEED_URL = 'https://feed.example/catalog.csv';
    try {
      const adapter = adapterFor(CSV);
      const result = await adapter.validateConnection();
      expect(result.valid).toBe(true);
    } finally {
      if (prev === undefined) delete process.env.CSV_FEED_URL;
      else process.env.CSV_FEED_URL = prev;
    }
  });

  it('validateConnection reports missing required columns', async () => {
    const prev = process.env.CSV_FEED_URL;
    process.env.CSV_FEED_URL = 'https://feed.example/bad.csv';
    try {
      const adapter = adapterFor('title,price\nA,1\n');
      const result = await adapter.validateConnection();
      expect(result.valid).toBe(false);
      expect(result.reason?.toLowerCase()).toContain('missing required columns');
    } finally {
      if (prev === undefined) delete process.env.CSV_FEED_URL;
      else process.env.CSV_FEED_URL = prev;
    }
  });
});

describe('adapter factory', () => {
  it('registers the csv adapter', () => {
    const ids = listSupplierAdapters();
    expect(ids).toContain('csv');
    expect(ids).toContain('mock');
  });

  it('REQUIRED_CSV_KEYS are a stable contract for the CSV columns', () => {
    expect(REQUIRED_CSV_KEYS).toContain('title');
    expect(REQUIRED_CSV_KEYS).toContain('supplier_price_cents');
    expect(REQUIRED_CSV_KEYS).toContain('source_url');
  });
});
