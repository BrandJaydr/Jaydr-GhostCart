/**
 * HTML Product Adapter — Stage 2 & 3 Enhanced Ingestion Engine
 *
 * A multi-tier supplier adapter that extracts structured product data from HTML:
 *   1. JSON-LD structured data (application/ld+json, Product schema)
 *   2. Embedded JavaScript execution state (window.runParams, window._page_data_, window.data)
 *   3. OpenGraph meta tags (og:title, og:price, og:image, ...)
 *   4. Standard meta tags + <title> + <img> fallbacks
 *   5. Variant SKU tree extraction (options, attributes, per-SKU pricing & inventory)
 *   6. Landed shipping calculation & freight estimation
 *
 * Uses the resilient HttpClient (connection pooling, per-host throttling & Redis response cache).
 * Emits detailed telemetry logs with correlation IDs for real-time observability.
 *
 * Reference: Production Blueprint §6.2 Adapter Contract, Research Dossiers (SpiderFoot, comalex, sudheer-ranga)
 */

import type { ISupplierAdapter } from './supplier.interface';
import type { CanonicalProduct, ProductVariant, ShippingOption } from '@/lib/types/canonical';
import { normalizeAvailability, priceToMinorUnits } from './normalize';
import { httpClient } from '@/lib/http/client';
import { logger } from '@/lib/logger';

/**
 * Extract the first JSON-LD Product object from an HTML document.
 * Handles single-object, array, and @graph structures.
 */
function extractJsonLdProduct(html: string): Record<string, unknown> | null {
  const blockRegex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(html)) !== null) {
    const raw = match[1].trim();
    try {
      const parsed: unknown = JSON.parse(raw);
      const candidates: unknown[] = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === 'object' &&
            Array.isArray((parsed as { '@graph'?: unknown })['@graph'])
          ? ((parsed as { '@graph': unknown[] })['@graph'])
          : [parsed];
      for (const candidate of candidates) {
        if (candidate && typeof candidate === 'object') {
          const type = (candidate as { '@type'?: string | string[] })['@type'];
          const types = Array.isArray(type) ? type : type ? [type] : [];
          if (types.includes('Product')) {
            return candidate as Record<string, unknown>;
          }
        }
      }
    } catch {
      // Skip malformed JSON-LD blocks
    }
  }
  return null;
}

/**
 * Extract embedded JavaScript global state (AliExpress runParams, Taobao pageData, etc.)
 */
function extractEmbeddedState(html: string): Record<string, unknown> | null {
  const patterns = [
    /window\.runParams\s*=\s*({[\s\S]*?})\s*;/i,
    /window\._page_data_\s*=\s*({[\s\S]*?})\s*;/i,
    /window\.data\s*=\s*({[\s\S]*?})\s*;/i,
    /data:\s*({[\s\S]*?})\s*,\s*csrfToken/i,
    /var\s+runParams\s*=\s*({[\s\S]*?})\s*;/i,
  ];

  for (const regex of patterns) {
    const m = regex.exec(html);
    if (m && m[1]) {
      const raw = m[1].trim();
      // 1. Try strict JSON parse
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return parsed as Record<string, unknown>;
        }
      } catch {
        // 2. Try converting relaxed JS object literal to JSON
        try {
          const relaxedJson = raw
            .replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":')
            .replace(/'/g, '"');
          const parsed = JSON.parse(relaxedJson);
          if (parsed && typeof parsed === 'object') {
            return parsed as Record<string, unknown>;
          }
        } catch {
          // Continue to next pattern
        }
      }
    }
  }
  return null;
}

/** Extract a meta tag by property or name, regardless of attribute order. */
function extractMetaTag(html: string, name: string): string | null {
  const nameRe = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(
    '<meta[^>]+(?:property|name)=["\']' + nameRe + '["\'][^>]*content=["\']([^"\']*)["\']',
    'i',
  );
  let m = regex.exec(html);
  if (m) return m[1].trim();

  const reversed = new RegExp(
    '<meta[^>]+content=["\']([^"\']*)["\'][^>]*(?:property|name)=["\']' + nameRe + '["\']',
    'i',
  );
  m = reversed.exec(html);
  return m ? m[1].trim() : null;
}

/** Extract the <title> tag content. */
function extractTitle(html: string): string {
  const m = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  return m ? m[1].trim() : '';
}

/** Resolve a possibly-relative image URL against the page's base URL. */
function resolveUrl(raw: string, base: string): string {
  try {
    return new URL(raw, base).toString();
  } catch {
    return raw;
  }
}

/** Extract image URLs from JSON-LD, OpenGraph, then first <img>. */
function extractImages(
  html: string,
  jsonLd: Record<string, unknown> | null,
  embeddedState: Record<string, unknown> | null,
  baseUrl: string,
): string[] {
  const urls: string[] = [];

  // 1. JSON-LD images
  if (jsonLd) {
    const img = jsonLd['image'];
    if (typeof img === 'string') urls.push(img);
    else if (Array.isArray(img)) {
      for (const i of img) {
        if (typeof i === 'string') urls.push(i);
        else if (i && typeof i === 'object' && typeof (i as { url?: unknown }).url === 'string') {
          urls.push((i as { url: string }).url);
        }
      }
    }
  }

  // 2. Embedded state images
  if (embeddedState) {
    const imageModule = embeddedState['imageModule'] as { imagePathList?: string[] } | undefined;
    const dataModule = embeddedState['data'] as { imageList?: string[] } | undefined;
    if (imageModule?.imagePathList && Array.isArray(imageModule.imagePathList)) {
      urls.push(...imageModule.imagePathList);
    } else if (dataModule?.imageList && Array.isArray(dataModule.imageList)) {
      urls.push(...dataModule.imageList);
    }
  }

  // 3. OpenGraph image
  const ogImage = extractMetaTag(html, 'og:image');
  if (ogImage) urls.push(ogImage);

  // 4. First <img> with src
  if (urls.length === 0) {
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;
    const m = imgRegex.exec(html);
    if (m) urls.push(m[1].trim());
  }

  const unique = Array.from(new Set(urls.filter(Boolean)));
  return unique.map((u) => resolveUrl(u, baseUrl));
}

/** Extract price amount + currency from JSON-LD offer, embeddedState, or OpenGraph/meta. */
function extractPrice(
  html: string,
  jsonLd: Record<string, unknown> | null,
  embeddedState: Record<string, unknown> | null,
): { amount: string | null; currency: string | null } {
  // 1. JSON-LD offers
  if (jsonLd) {
    const offers = jsonLd['offers'];
    const offer = Array.isArray(offers)
      ? (offers[0] as { price?: string; priceCurrency?: string } | undefined)
      : (offers as { price?: string; priceCurrency?: string } | undefined);
    if (offer && typeof offer === 'object' && typeof offer.price === 'string') {
      return { amount: offer.price, currency: offer.priceCurrency ?? null };
    }
    const priceStr = jsonLd['price'];
    if (priceStr && typeof priceStr === 'string') {
      const cur = jsonLd['priceCurrency'];
      return { amount: priceStr, currency: typeof cur === 'string' ? cur : null };
    }
  }

  // 2. Embedded State (runParams)
  if (embeddedState) {
    const priceModule =
      (embeddedState['priceModule'] as { minAmount?: { value?: number; currency?: string } } | undefined) ||
      (embeddedState['price'] as { formattedPrice?: string; currency?: string } | undefined);
    if (priceModule && 'minAmount' in priceModule && priceModule.minAmount?.value) {
      return {
        amount: String(priceModule.minAmount.value),
        currency: priceModule.minAmount.currency ?? 'USD',
      };
    }
  }

  // 3. OpenGraph / meta price tags
  const ogPrice =
    extractMetaTag(html, 'product:price:amount') ?? extractMetaTag(html, 'price:amount');
  const ogCurrency =
    extractMetaTag(html, 'product:price:currency') ?? extractMetaTag(html, 'price:currency');
  if (ogPrice) {
    return { amount: ogPrice, currency: ogCurrency };
  }

  // 4. Regex fallback
  const priceRegex =
    /(?:USD|EUR|GBP|JPY|CNY|\$|€|£|¥)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)|(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|EUR|GBP|JPY|CNY)$/i;
  const m = priceRegex.exec(html);
  if (m) {
    return { amount: m[1] ?? m[2] ?? null, currency: null };
  }
  return { amount: null, currency: null };
}

/** Normalize GTIN variations to canonical 'gtin' key. */
function normalizeIdKey(key: string): string {
  return key === 'gtin13' || key === 'gtin8' ? 'gtin' : key;
}

/** Extract SKU / GTIN / UPC / MPN / ISBN identifiers. */
function extractIdentifiers(
  jsonLd: Record<string, unknown> | null,
  embeddedState: Record<string, unknown> | null,
): Record<string, string> {
  const ids: Record<string, string> = {};
  if (jsonLd) {
    for (const key of ['sku', 'gtin', 'gtin13', 'gtin8', 'upc', 'mpn', 'isbn']) {
      const v = jsonLd[key];
      if (typeof v === 'string' && v.trim()) ids[normalizeIdKey(key)] = v.trim();
    }
  }
  if (embeddedState) {
    const id = embeddedState['productId'] || embeddedState['id'];
    if (id && !ids['sku']) {
      ids['sku'] = String(id);
    }
  }
  return ids;
}

/** Extract multi-variant option trees (Color, Size, SKU price/stock). */
function extractVariants(embeddedState: Record<string, unknown> | null): ProductVariant[] {
  const variants: ProductVariant[] = [];
  if (!embeddedState) return variants;

  const skuModule = embeddedState['skuModule'] as
    | {
        skuPriceList?: Array<{
          skuId: string | number;
          skuVal?: { actSkuMultiCurrencyPrice?: string; skuAmount?: { value?: number }; availQuantity?: number };
          skuAttr?: string;
        }>;
      }
    | undefined;

  if (skuModule?.skuPriceList && Array.isArray(skuModule.skuPriceList)) {
    for (const item of skuModule.skuPriceList) {
      const skuId = String(item.skuId);
      const priceStr = item.skuVal?.actSkuMultiCurrencyPrice || item.skuVal?.skuAmount?.value || '0';
      const stock = item.skuVal?.availQuantity ?? 10;
      const priceCents = priceToMinorUnits(String(priceStr));

      variants.push({
        skuId,
        title: item.skuAttr || `Variant ${skuId}`,
        priceCents: priceCents ?? 0,
        stock,
        attributes: { rawAttr: item.skuAttr || '' },
      });
    }
  }

  return variants;
}

/** Extract available shipping carriers and freight rates. */
function extractShipping(
  embeddedState: Record<string, unknown> | null,
  html: string,
): ShippingOption[] {
  const options: ShippingOption[] = [];

  if (embeddedState) {
    const shippingModule = embeddedState['shippingModule'] as
      | {
          freightList?: Array<{
            companyName?: string;
            freightAmount?: { value?: number };
            time?: string;
            tracking?: boolean;
          }>;
        }
      | undefined;

    if (shippingModule?.freightList && Array.isArray(shippingModule.freightList)) {
      for (const opt of shippingModule.freightList) {
        const cost = opt.freightAmount?.value ? Math.round(opt.freightAmount.value * 100) : 0;
        const days = parseInt(opt.time || '15', 10) || 15;
        options.push({
          serviceName: opt.companyName || 'Standard Shipping',
          costCents: cost,
          estimatedDays: days,
          trackingAvailable: opt.tracking ?? true,
          carrier: opt.companyName,
        });
      }
    }
  }

  // Default fallback if no shipping module detected
  if (options.length === 0) {
    const hasFreeShipping = /free\s+shipping/i.test(html);
    options.push({
      serviceName: hasFreeShipping ? 'Free Standard Shipping' : 'Standard Carrier',
      costCents: hasFreeShipping ? 0 : 499,
      estimatedDays: 14,
      trackingAvailable: true,
    });
  }

  return options;
}

/** Extract description from JSON-LD then OpenGraph. */
function extractDescription(jsonLd: Record<string, unknown> | null, html: string): string {
  if (jsonLd && typeof jsonLd['description'] === 'string' && jsonLd['description'].trim()) {
    return (jsonLd['description'] as string).trim();
  }
  return extractMetaTag(html, 'og:description') ?? '';
}

/** Map schema.org availability URL or plain word. */
function mapSchemaAvailability(value: string): string {
  const v = value.trim();
  const lastSegment = v.split('/').pop() ?? v;
  const key = lastSegment.toLowerCase();
  if (key.includes('instock')) return 'in_stock';
  if (key.includes('outofstock') || key.includes('soldout')) return 'out_of_stock';
  if (key.includes('preorder')) return 'preorder';
  if (key.includes('backorder')) return 'backorder';
  if (key.includes('discontinued')) return 'discontinued';
  if (key.includes('limited') || key.includes('lowstock')) return 'limited';
  return v;
}

/** Map JSON-LD availability to a canonical availability word. */
function extractAvailability(jsonLd: Record<string, unknown> | null, html: string): string {
  if (jsonLd) {
    const offers = jsonLd['offers'];
    const offer = Array.isArray(offers)
      ? (offers[0] as { availability?: string } | undefined)
      : (offers as { availability?: string } | undefined);
    if (offer && typeof offer === 'object' && typeof offer.availability === 'string') {
      return mapSchemaAvailability(offer.availability);
    }
  }
  const meta =
    extractMetaTag(html, 'product:availability') ?? extractMetaTag(html, 'og:availability');
  return meta ? mapSchemaAvailability(meta) : '';
}

/** Compute per-field confidence scores (0.0–1.0) with warnings. */
function scoreHtmlFields(
  jsonLd: Record<string, unknown> | null,
  embeddedState: Record<string, unknown> | null,
  title: string,
  description: string,
  images: string[],
  price: { amount: string | null; currency: string | null },
  identifiers: Record<string, string>,
): { field: string; score: number; warnings: string[] }[] {
  const hasStructuredData = jsonLd !== null || embeddedState !== null;
  return [
    {
      field: 'title',
      score: title.length > 0 ? 1 : 0,
      warnings: title.length === 0 ? ['Title could not be extracted'] : [],
    },
    {
      field: 'description',
      score: description.length > 0 ? (description.length > 50 ? 1 : 0.7) : 0,
      warnings: description.length === 0 ? ['Description could not be extracted'] : [],
    },
    {
      field: 'primary_image_url',
      score: images.length > 0 ? 1 : 0,
      warnings: images.length === 0 ? ['No images found'] : [],
    },
    { field: 'availability', score: 0.8, warnings: [] },
    {
      field: 'identifiers',
      score: Object.keys(identifiers).length > 0 ? 1 : 0.4,
      warnings:
        Object.keys(identifiers).length === 0 ? ['No SKU/GTIN/UPC identifiers found'] : [],
    },
    {
      field: 'price',
      score: price.amount && price.currency ? 1 : price.amount ? 0.6 : 0,
      warnings:
        price.amount && !price.currency
          ? ['Price found but currency not detected — defaulting to USD']
          : [],
    },
    {
      field: 'structured_data',
      score: hasStructuredData ? 1 : 0.3,
      warnings: !hasStructuredData
        ? ['No JSON-LD or embedded runParams found; fell back to meta-tag extraction']
        : [],
    },
  ];
}

/**
 * HtmlProductAdapter
 * Enhanced scraper implementing ISupplierAdapter with hybrid fallback extraction.
 */
export class HtmlProductAdapter implements ISupplierAdapter {
  readonly adapterId = 'html';

  private readonly fetcher: (url: string) => Promise<string>;

  constructor(fetcher?: (url: string) => Promise<string>) {
    this.fetcher =
      fetcher ??
      (async (url: string) => {
        const res = await httpClient.get<string>(url, {
          useCache: true,
          cacheTtlSeconds: 600, // 10 minute cache for scraper pages
        });
        if (res.status >= 400) {
          throw new Error(`Product page returned HTTP ${res.status}`);
        }
        return res.data;
      });
  }

  async loadHtml(url: string): Promise<string> {
    return this.fetcher(url);
  }

  async validateConnection(): Promise<{ valid: boolean; reason?: string }> {
    return { valid: true, reason: 'HTML adapter is universal — connection is healthy' };
  }

  async importProduct(url: string, tenantId: string): Promise<CanonicalProduct> {
    const startTime = Date.now();
    logger.debug('SCRAPER', `[Import Starting] Ingesting product URL: ${url}`, { tenantId });

    const html = await this.loadHtml(url);
    const jsonLd = extractJsonLdProduct(html);
    const embeddedState = extractEmbeddedState(html);

    const title =
      (jsonLd?.['name'] as string | undefined)?.trim() ||
      (embeddedState?.['titleModule'] as { subject?: string } | undefined)?.subject ||
      extractMetaTag(html, 'og:title') ||
      extractTitle(html);

    if (!title) {
      logger.error('SCRAPER', `[Extraction Failed] Could not find product title at ${url}`);
      throw new Error('Could not extract a product title — verify the URL is a product page');
    }

    const description = extractDescription(jsonLd, html);
    const images = extractImages(html, jsonLd, embeddedState, url);
    const price = extractPrice(html, jsonLd, embeddedState);
    const identifiers = extractIdentifiers(jsonLd, embeddedState);
    const variants = extractVariants(embeddedState);
    const shippingOptions = extractShipping(embeddedState, html);
    const availability = normalizeAvailability(extractAvailability(jsonLd, html));
    const priceCents = price.amount ? priceToMinorUnits(price.amount) : null;
    const currency = price.currency || 'USD';

    // Strip hash fragment for stable source URL
    const sourceUrl = url.replace(/#.*$/, '');

    const confidence = scoreHtmlFields(jsonLd, embeddedState, title, description, images, price, identifiers);
    const completeness = Math.round(
      (confidence.reduce((sum, c) => sum + c.score, 0) / confidence.length) * 100,
    ) / 100;

    const durationMs = Date.now() - startTime;
    logger.info('SCRAPER', `[Extraction Complete] Successfully normalized product "${title.slice(0, 40)}..."`, {
      tenantId,
      sourceUrl,
      variantsFound: variants.length,
      shippingOptions: shippingOptions.length,
      durationMs,
      completeness,
    });

    return {
      id: `product_${Buffer.from(sourceUrl).toString('base64url').slice(0, 12)}`,
      tenantId,
      title: title || '',
      description,
      identifiers,
      primaryImageUrl: images[0] || null,
      additionalImageUrls: images.slice(1),
      supplierPriceCents: priceCents ?? 0,
      currency,
      availability,
      sourceUrl,
      supplierId: this.adapterId,
      variants: variants.length > 0 ? variants : undefined,
      shippingOptions: shippingOptions.length > 0 ? shippingOptions : undefined,
      rawSourceMetadata: {
        adapter: 'html',
        originalUrl: url,
        hasJsonLd: !!jsonLd,
        hasEmbeddedState: !!embeddedState,
      },
      confidence,
      importedAt: new Date().toISOString(),
      lastRefreshedAt: null,
      importDurationMs: durationMs,
      normalizationCompleteness: completeness,
    };
  }

  async fetchProduct(productId: string, tenantId: string): Promise<CanonicalProduct> {
    const prefix = 'product_';
    if (productId.startsWith(prefix)) {
      try {
        const decoded = Buffer.from(productId.slice(prefix.length), 'base64url').toString('utf8');
        if (decoded.startsWith('http')) {
          return this.importProduct(decoded, tenantId);
        }
      } catch {
        // Fall through
      }
    }
    if (productId.startsWith('http')) {
      return this.importProduct(productId, tenantId);
    }
    throw new Error(`Cannot resolve source URL for product ID: ${productId}`);
  }
}

export const htmlAdapter = new HtmlProductAdapter();