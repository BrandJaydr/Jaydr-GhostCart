import { describe, it, expect } from 'vitest';
import { HtmlProductAdapter } from '@/lib/adapters/html.adapter';
import { listSupplierAdapters } from '@/lib/adapters/factory';

const TEST_TENANT = '00000000-0000-0000-0000-000000000001';

const JSON_LD_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Acme Wireless Mouse</title>
  <meta property="og:title" content="Acme Wireless Mouse" />
  <meta property="og:image" content="https://cdn.example.com/mouse.jpg" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": "Acme Wireless Mouse",
    "description": "Ergonomic 2.4GHz wireless mouse with silent clicks and 12-month battery life.",
    "sku": "ACME-MOUSE-001",
    "gtin": "00123456789012",
    "image": ["https://cdn.example.com/mouse-1.jpg", "https://cdn.example.com/mouse-2.jpg"],
    "offers": {
      "@type": "Offer",
      "price": "29.99",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    }
  }
  </script>
</head>
<body><h1>Acme Wireless Mouse</h1></body>
</html>`;

const META_ONLY_HTML = `<html>
<head>
  <title>Meta-only Product</title>
  <meta content="Meta-only Product" property="og:title" />
  <meta content="9001234567890" property="product:retailer_item_id" />
  <meta content="19.95" property="product:price:amount" />
  <meta content="EUR" property="product:price:currency" />
  <meta content="https://img.example.com/p.jpg" property="og:image" />
</head>
<body><img src="/local.jpg" /></body>
</html>`;

describe('HtmlProductAdapter', () => {
  function adapterFor(html: string) {
    return new HtmlProductAdapter(async () => html);
  }

  describe('JSON-LD extraction', () => {
    it('imports a product from JSON-LD structured data', async () => {
      const adapter = adapterFor(JSON_LD_HTML);
      const product = await adapter.importProduct('https://shop.example.com/p/mouse', TEST_TENANT);

      expect(product.title).toBe('Acme Wireless Mouse');
      expect(product.description).toContain('2.4GHz wireless');
      expect(product.identifiers.sku).toBe('ACME-MOUSE-001');
      expect(product.identifiers.gtin).toBe('00123456789012');
      expect(product.supplierPriceCents).toBe(2999); // $29.99
      expect(product.currency).toBe('USD');
      expect(product.availability).toBe('in_stock');
      expect(product.primaryImageUrl).toBe('https://cdn.example.com/mouse-1.jpg');
      expect(product.additionalImageUrls).toContain('https://cdn.example.com/mouse-2.jpg');
      expect(product.sourceUrl).toBe('https://shop.example.com/p/mouse');
      expect(product.supplierId).toBe('html');
      expect(product.tenantId).toBe(TEST_TENANT);
    });

    it('keeps a stable deterministic product id for the same source URL', async () => {
      const adapter = adapterFor(JSON_LD_HTML);
      const a = await adapter.importProduct('https://shop.example.com/p/mouse', TEST_TENANT);
      const b = await adapter.importProduct('https://shop.example.com/p/mouse#reviews', TEST_TENANT);
      expect(a.id).toBe(b.id);
    });
  });

  describe('Meta/OpenGraph fallback', () => {
    it('extracts from meta tags when no JSON-LD exists (attribute order agnostic)', async () => {
      const adapter = adapterFor(META_ONLY_HTML);
      const product = await adapter.importProduct('https://store.example.net/item/1', TEST_TENANT);

      expect(product.title).toBe('Meta-only Product');
      expect(product.supplierPriceCents).toBe(1995);
      expect(product.currency).toBe('EUR');
      expect(product.primaryImageUrl).toBe('https://img.example.com/p.jpg');
    });
  });

  describe('Error handling', () => {
    it('throws when the page has no extractable title', async () => {
      const adapter = adapterFor('<html><body><h1>No meta here</h1></body></html>');
      await expect(
        adapter.importProduct('https://example.com/not-a-product', TEST_TENANT),
      ).rejects.toThrow(/title/i);
    });

    it('propagates HTTP-level failures from the fetcher', async () => {
      const adapter = new HtmlProductAdapter(async () => {
        throw new Error('Product page returned HTTP 404');
      });
      await expect(
        adapter.importProduct('https://example.com/missing', TEST_TENANT),
      ).rejects.toThrow('HTTP 404');
    });
  });

  describe('validateConnection', () => {
    it('is always valid (universal adapter)', async () => {
      const adapter = adapterFor(JSON_LD_HTML);
      await expect(adapter.validateConnection()).resolves.toMatchObject({ valid: true });
    });
  });
});

describe('adapter factory registration', () => {
  it('registers the html adapter', () => {
    expect(listSupplierAdapters()).toContain('html');
  });
});