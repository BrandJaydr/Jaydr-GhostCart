import { describe, it, expect } from 'vitest';
import { HtmlProductAdapter } from '@/lib/adapters/html.adapter';

describe('HtmlProductAdapter', () => {
  it('should extract product details from embedded runParams state', async () => {
    const mockHtml = `
      <html>
        <head><title>Fallback Title</title></head>
        <body>
          <script>
            window.runParams = {
              productId: "1005006200000",
              titleModule: { subject: "Wireless Noise Cancelling Earbuds Pro" },
              priceModule: { minAmount: { value: 29.99, currency: "USD" } },
              imageModule: { imagePathList: ["https://img.supplier.com/1.jpg", "https://img.supplier.com/2.jpg"] },
              skuModule: {
                skuPriceList: [
                  { skuId: "sku_black", skuAttr: "Color: Black", skuVal: { actSkuMultiCurrencyPrice: "29.99", availQuantity: 50 } },
                  { skuId: "sku_white", skuAttr: "Color: White", skuVal: { actSkuMultiCurrencyPrice: "31.99", availQuantity: 20 } }
                ]
              },
              shippingModule: {
                freightList: [
                  { companyName: "AliExpress Standard", freightAmount: { value: 2.50 }, time: "12", tracking: true }
                ]
              }
            };
          </script>
        </body>
      </html>
    `;

    const adapter = new HtmlProductAdapter(async () => mockHtml);
    const product = await adapter.importProduct('https://aliexpress.com/item/1005006200000.html', 'tenant_123');

    expect(product.title).toBe('Wireless Noise Cancelling Earbuds Pro');
    expect(product.supplierPriceCents).toBe(2999);
    expect(product.currency).toBe('USD');
    expect(product.primaryImageUrl).toBe('https://img.supplier.com/1.jpg');
    expect(product.additionalImageUrls).toContain('https://img.supplier.com/2.jpg');
    expect(product.variants).toBeDefined();
    expect(product.variants?.length).toBe(2);
    expect(product.variants?.[0].skuId).toBe('sku_black');
    expect(product.variants?.[0].priceCents).toBe(2999);
    expect(product.shippingOptions).toBeDefined();
    expect(product.shippingOptions?.[0].serviceName).toBe('AliExpress Standard');
    expect(product.shippingOptions?.[0].costCents).toBe(250);
  });

  it('should extract product details from JSON-LD schema fallback', async () => {
    const mockHtml = `
      <html>
        <head>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "Classic Cotton T-Shirt",
              "description": "100% organic cotton tee.",
              "image": "https://img.supplier.com/tee.jpg",
              "offers": {
                "@type": "Offer",
                "price": "19.50",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
              }
            }
          </script>
        </head>
        <body></body>
      </html>
    `;

    const adapter = new HtmlProductAdapter(async () => mockHtml);
    const product = await adapter.importProduct('https://supplier.com/tee', 'tenant_123');

    expect(product.title).toBe('Classic Cotton T-Shirt');
    expect(product.supplierPriceCents).toBe(1950);
    expect(product.description).toBe('100% organic cotton tee.');
    expect(product.primaryImageUrl).toBe('https://img.supplier.com/tee.jpg');
    expect(product.availability).toBe('in_stock');
  });
});