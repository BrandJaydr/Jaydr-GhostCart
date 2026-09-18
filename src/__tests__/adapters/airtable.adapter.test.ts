import { describe, it, expect } from 'vitest';
import {
  AirtableSupplierAdapter,
  airtableAdapter,
  airtableProductId,
  coerceAirtableField,
  coerceAirtableRow,
  pickTenantConnection,
  shouldRefreshToken,
  type AirtableConnectionRow,
  type AirtableSourceConfig,
} from '@/lib/adapters/airtable.adapter';
import { listSupplierAdapters } from '@/lib/adapters/factory';

/** Canned Airtable list-records payload (shape: { records: [{ id, fields }] }). */
const AIRTABLE_PAYLOAD = {
  records: [
    {
      id: 'recMouse01',
      fields: {
        title: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse',
        supplier_price_cents: 29.99,
        currency: 'USD',
        availability: 'In stock',
        source_url: 'https://airtable.com/appBase/tblTable/recMouse01',
        sku: 'SKU-001',
        primary_image_url: [{ url: 'https://img.example/mouse.png' }],
        additional_image_urls: [{ url: 'https://img.example/mouse-2.png' }],
      },
    },
    {
      id: 'recKeyboard02',
      fields: {
        title: 'Keyboard',
        description: 'Mechanical keyboard',
        supplier_price_cents: 49.99,
        currency: 'USD',
        availability: 'Out of stock',
        source_url: 'https://airtable.com/appBase/tblTable/recKeyboard02',
        sku: 'SKU-002',
      },
    },
  ],
};

/** Airtable richer types are reduced to the CSV-style strings normalize expects. */
describe('airtable.adapter field coercion', () => {
  it('coerces number/boolean/string Airtable field types to CSV-style strings', () => {
    expect(coerceAirtableField(29.99, 'supplier_price_cents')).toBe('29.99');
    expect(coerceAirtableField('  Hello  ', 'title')).toBe('Hello');
    expect(coerceAirtableField(true, 'availability')).toBe('yes');
    expect(coerceAirtableField(false, 'availability')).toBe('no');
    expect(coerceAirtableField(null, 'title')).toBe('');
    expect(coerceAirtableField(undefined, 'title')).toBe('');
  });

  it('flattens attachment arrays (primary = first url, additional = all)', () => {
    const attachments = [
      { url: 'https://img.example/a.png' },
      { url: 'https://img.example/b.png' },
    ];
    expect(coerceAirtableField(attachments, 'primary_image_url')).toBe(
      'https://img.example/a.png',
    );
    expect(coerceAirtableField(attachments, 'additional_image_urls')).toBe(
      'https://img.example/a.png|https://img.example/b.png',
    );
  });

  it('joins multi-select string arrays', () => {
    expect(coerceAirtableField(['a', 'b', 'c'], 'tags')).toBe('a|b|c');
  });

  it('builds a row from shared fields only (mapped + identity)', () => {
    const fields = {
      Name: 'Custom Label Field',
      title: 'Identity Match',
      AirtableOnly: 'never synced',
    };
    const row = coerceAirtableRow(fields, { title: 'Name' });
    expect(row.title).toBe('Custom Label Field');
    expect(row.AirtableOnly).toBeUndefined();
  });
});

describe('AirtableSupplierAdapter (stubbed fetcher, no network)', () => {
  function adapterFor(payload: unknown, config?: Partial<AirtableSourceConfig>) {
    const fetcher = async () =>
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    return new AirtableSupplierAdapter({
      fetcher,
      configResolver: async () => ({
        accessToken: 'tok_test',
        baseId: 'appBase',
        tableName: 'Products',
        fieldMapping: {},
        ...config,
      }),
    });
  }

  it('imports the record whose rec-id appears in the URL', async () => {
    const adapter = adapterFor(AIRTABLE_PAYLOAD);
    const product = await adapter.importProduct(
      'https://airtable.com/appBase/tblTable/recKeyboard02',
      'tenant-1',
    );
    expect(product.title).toBe('Keyboard');
    expect(product.supplierId).toBe('airtable');
    expect(product.supplierPriceCents).toBe(4999);
    expect(product.rawSourceMetadata.adapter).toBe('airtable');
    expect(product.rawSourceMetadata.airtableRecordId).toBe('recKeyboard02');
  });

  it('matches by shared source_url and flattens image attachment arrays', async () => {
    const adapter = adapterFor(AIRTABLE_PAYLOAD);
    const product = await adapter.importProduct(
      'https://airtable.com/appBase/tblTable/recMouse01',
      'tenant-1',
    );
    expect(product.title).toBe('Wireless Mouse');
    expect(product.primaryImageUrl).toBe('https://img.example/mouse.png');
    expect(product.additionalImageUrls).toContain('https://img.example/mouse-2.png');
    expect(product.identifiers.sku).toBe('SKU-001');
  });

  it('throws when no Airtable connection is configured for the tenant', async () => {
    const adapter = new AirtableSupplierAdapter({
      configResolver: async () => null,
    });
    await expect(
      adapter.importProduct('https://airtable.com/x', 'tenant-1'),
    ).rejects.toThrow(/Sign in with Airtable/);
  });

  it('validateConnection reports valid when env PAT config is present', async () => {
    const prev = captureEnv();
    process.env.AIRTABLE_TOKEN = 'pat_test';
    process.env.AIRTABLE_BASE_ID = 'appBase';
    process.env.AIRTABLE_TABLE = 'Products';
    try {
      const adapter = adapterFor(AIRTABLE_PAYLOAD);
      const result = await adapter.validateConnection();
      expect(result.valid).toBe(true);
      expect(result.reason).toContain('valid');
    } finally {
      restoreEnv(prev);
    }
  });

  it('validateConnection reports missing config when env is unset', async () => {
    const prev = captureEnv();
    delete process.env.AIRTABLE_TOKEN;
    delete process.env.AIRTABLE_BASE_ID;
    delete process.env.AIRTABLE_TABLE;
    try {
      const adapter = adapterFor(AIRTABLE_PAYLOAD);
      const result = await adapter.validateConnection();
      expect(result.valid).toBe(false);
      expect(result.reason?.toLowerCase()).toContain('no airtable');
    } finally {
      restoreEnv(prev);
    }
  });

  it('fetchProduct resolves by deterministic product id', async () => {
    const adapter = adapterFor(AIRTABLE_PAYLOAD);
    const imported = await adapter.importProduct(
      'https://airtable.com/appBase/tblTable/recMouse01',
      'tenant-1',
    );
    const refreshed = await adapter.fetchProduct(imported.id, 'tenant-1');
    expect(refreshed.title).toBe('Wireless Mouse');
  });
});

describe('adapter factory', () => {
  it('registers the airtable adapter', () => {
    expect(airtableAdapter.adapterId).toBe('airtable');
    expect(listSupplierAdapters()).toContain('airtable');
  });
});

function captureEnv() {
  return {
    token: process.env.AIRTABLE_TOKEN,
    base: process.env.AIRTABLE_BASE_ID,
    table: process.env.AIRTABLE_TABLE,
  };
}

function restoreEnv(prev: {
  token: string | undefined;
  base: string | undefined;
  table: string | undefined;
}) {
  if (prev.token === undefined) delete process.env.AIRTABLE_TOKEN;
  else process.env.AIRTABLE_TOKEN = prev.token;
  if (prev.base === undefined) delete process.env.AIRTABLE_BASE_ID;
  else process.env.AIRTABLE_BASE_ID = prev.base;
  if (prev.table === undefined) delete process.env.AIRTABLE_TABLE;
  else process.env.AIRTABLE_TABLE = prev.table;
}

// ─── Hardening regressions (Phase 1.5) ──────────────────────────────────────

const REC_A = {
  id: 'recA',
  fields: {
    title: 'A-Mouse',
    source_url: 'https://airtable.com/appBase/tblTable/recA',
    supplier_price_cents: 999,
  },
};
const REC_B = {
  id: 'recB',
  fields: {
    title: 'B-Keyboard',
    source_url: 'https://airtable.com/appBase/tblTable/recB',
    supplier_price_cents: 4999,
  },
};

describe('AirtableSupplierAdapter hardening (Phase 1.5)', () => {
  const CFG: AirtableSourceConfig = {
    accessToken: 'tok_test',
    baseId: 'appBase',
    tableName: 'Products',
    fieldMapping: {},
  };

  function okFetcher(payload: unknown) {
    return async () =>
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
  }

  it('paginates with offset until the API returns no next page', async () => {
    const fetcher = async (input: string | URL) => {
      const hasOffset = input.toString().includes('offset=');
      const body = hasOffset
        ? { records: [REC_B] } // second page, no cursor → loop ends
        : { records: [REC_A], offset: 'page2' }; // first page has a cursor
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };
    const adapter = new AirtableSupplierAdapter({
      fetcher,
      configResolver: async () => CFG,
    });
    // recB lives on page 2 — without the offset loop it could never match.
    const product = await adapter.importProduct(
      'https://airtable.com/appBase/tblTable/recB',
      'tenant-1',
    );
    expect(product.title).toBe('B-Keyboard');
  });

  it('derives ids from the COERCED row (fieldMapping source_url) — H1 regression', async () => {
    const records = [
      { id: 'recMappedA', fields: { title: 'Mapped A', 'Product URL': 'https://airtable.com/a' } },
      { id: 'recMappedB', fields: { title: 'Mapped B', 'Product URL': 'https://airtable.com/b' } },
    ];
    const adapter = new AirtableSupplierAdapter({
      fetcher: okFetcher({ records }),
      configResolver: async () => ({ ...CFG, fieldMapping: { source_url: 'Product URL' } }),
    });

    const imported = await adapter.importProduct(
      'https://airtable.com/appBase/tblTable/recMappedB',
      'tenant-1',
    );
    expect(imported.title).toBe('Mapped B');
    const expectedId = airtableProductId('https://airtable.com/b');
    expect(imported.id).toBe(expectedId);

    // fetchProduct by the same id must resolve to the SAME record (not fall
    // back to records[0]).
    const refreshed = await adapter.fetchProduct(imported.id, 'tenant-1');
    expect(refreshed.title).toBe('Mapped B');
    expect(refreshed.id).toBe(expectedId);
  });

  it('throws when a record has no title (NOT NULL column guard)', async () => {
    const adapter = new AirtableSupplierAdapter({
      fetcher: okFetcher({
        records: [{ id: 'recNoTitle', fields: { source_url: 'https://airtable.com/no-title' } }],
      }),
      configResolver: async () => CFG,
    });
    await expect(
      adapter.importProduct('https://airtable.com/appBase/tblTable/recNoTitle', 'tenant-1'),
    ).rejects.toThrow(/missing a title/);
  });

  it('stores the truly-raw fields for traceability (rawFields)', async () => {
    const adapter = new AirtableSupplierAdapter({
      fetcher: okFetcher({ records: [REC_A] }),
      configResolver: async () => CFG,
    });
    const product = await adapter.importProduct(
      'https://airtable.com/appBase/tblTable/recA',
      'tenant-1',
    );
    expect(product.rawSourceMetadata.rawFields).toEqual(REC_A.fields);
    expect(product.rawSourceMetadata.originalRow).toBeDefined();
    expect(product.rawSourceMetadata.airtableRecordId).toBe('recA');
  });

  it('fetchProduct throws when the id cannot be resolved (no silent wrong write)', async () => {
    const adapter = new AirtableSupplierAdapter({
      fetcher: okFetcher({ records: [REC_A] }),
      configResolver: async () => CFG,
    });
    await expect(
      adapter.fetchProduct('product_does_not_exist', 'tenant-1'),
    ).rejects.toThrow(/Cannot resolve Airtable record/);
  });
});

describe('pickTenantConnection (deterministic resolution)', () => {
  const mk = (user_id: string, connected_at: string): AirtableConnectionRow => ({
    id: `id_${user_id}`,
    user_id,
    access_token: 'tok',
    refresh_token: 'rt',
    token_expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    base_id: 'appBase',
    connected_at,
  });

  it('returns null for no rows', () => {
    expect(pickTenantConnection([], 'owner-1')).toBeNull();
  });

  it('prefers the tenant owner connection over a more recent non-owner one', () => {
    const rows = [
      mk('va-1', '2026-01-02T00:00:00Z'), // non-owner, more recent
      mk('owner-1', '2026-01-01T00:00:00Z'), // owner, older
    ];
    expect(pickTenantConnection(rows, 'owner-1')?.user_id).toBe('owner-1');
  });

  it('falls back to the most-recent connection when no owner connection exists', () => {
    const rows = [mk('a', '2026-01-01T00:00:00Z'), mk('b', '2026-01-03T00:00:00Z')];
    expect(pickTenantConnection(rows, 'owner-1')?.user_id).toBe('b');
  });

  it('is deterministic for multiple owner connections (most recent wins)', () => {
    const rows = [
      mk('owner-1', '2026-01-02T00:00:00Z'),
      mk('owner-2', '2026-01-01T00:00:00Z'),
    ];
    expect(pickTenantConnection(rows, 'owner-1')?.user_id).toBe('owner-1');
  });
});

describe('shouldRefreshToken (expiry window)', () => {
  const now = new Date('2026-01-01T12:00:00Z');
  const at = (offsetMs: number) => new Date(now.getTime() + offsetMs).toISOString();

  it('refreshes when the token is missing or malformed', () => {
    expect(shouldRefreshToken(null, now)).toBe(true);
    expect(shouldRefreshToken('not-a-date', now)).toBe(true);
  });

  it('refreshes when expired or inside the 60s safety window', () => {
    expect(shouldRefreshToken(at(-1), now)).toBe(true);
    expect(shouldRefreshToken(at(59_999), now)).toBe(true);
  });

  it('does not refresh when far from expiry', () => {
    expect(shouldRefreshToken(at(3_600_000), now)).toBe(false);
  });
});