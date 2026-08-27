/**
 * HTML Product Adapter — Stage 2 Extension
 *
 * A generic supplier adapter that fetches a product page URL and extracts
 * structured product data from HTML. Uses layered extraction:
 *   1. JSON-LD structured data (application/ld+json, Product schema)
 *   2. OpenGraph meta tags (og:title, og:price, og:image, ...)
 *   3. Standard meta tags + <title> + <img> fallbacks
 *
 * No external dependencies (no cheerio/jsdom) — uses regex for extraction.
 * Normalizes all fields to CanonicalProduct per the adapter contract.
 *
 * Reference: Production Blueprint §6.2 Adapter Contract, §1.2 Non-goals
 *
 * NOTE ON ALIEXPRESS: AliExpress has an official Open Platform API
 * (developers.aliexpress.com) requiring app_key + app_secret credentials.
 * This html adapter may work on AliExpress product pages that embed
 * JSON-LD Product schema; if the page uses heavy JS rendering, a dedicated
 * affiliate-API adapter will be needed (future work, requires credentials).
 */

import type { ISupplierAdapter } from './supplier.interface';
import type { CanonicalProduct } from '@/lib/types/canonical';
import { normalizeAvailability, priceToMinorUnits } from './normalize';

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
      // JSON-LD can be a single object, an array, or a @graph wrapper.
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

/** Extract a meta tag by property or name, regardless of attribute order. */
function extractMetaTag(html: string, name: string): string | null {
  const nameRe = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(
    '<meta[^>]+(?:property|name)=["\']' + nameRe + '["\'][^>]*content=["\']([^"\']*)["\']',
    'i',
  );
  let m = regex.exec(html);
  if (m) return m[1].trim();
  // Attribute order might be content first, then property/name.
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
  baseUrl: string,
): string[] {
  // 1. JSON-LD image (string | array | object with url)
  if (jsonLd) {
    const img = jsonLd['image'];
    const urls: string[] = [];
    if (typeof img === 'string') urls.push(img);
    else if (Array.isArray(img)) {
      for (const i of img) {
        if (typeof i === 'string') urls.push(i);
        else if (i && typeof i === 'object' && typeof (i as { url?: unknown }).url === 'string') {
          urls.push((i as { url: string }).url);
        }
      }
    } else if (
      img &&
      typeof img === 'object' &&
      typeof (img as { url?: unknown }).url === 'string'
    ) {
      urls.push((img as { url: string }).url);
    }
    if (urls.length > 0) return urls.map((u) => resolveUrl(u, baseUrl));
  }
  // 2. OpenGraph image
  const ogImage = extractMetaTag(html, 'og:image');
  if (ogImage) return [resolveUrl(ogImage, baseUrl)];
  // 3. First <img> with src
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;
  const m = imgRegex.exec(html);
  return m ? [resolveUrl(m[1].trim(), baseUrl)] : [];
}
/** Extract price amount + currency from JSON-LD offer or OpenGraph/meta. */
function extractPrice(
  html: string,
  jsonLd: Record<string, unknown> | null,
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
    // Some schemas put price directly on the product.
    const priceStr = jsonLd['price'];
    if (priceStr && typeof priceStr === 'string') {
      const cur = jsonLd['priceCurrency'];
      return { amount: priceStr, currency: typeof cur === 'string' ? cur : null };
    }
  }
  // 2. OpenGraph / meta price tags
  const ogPrice =
    extractMetaTag(html, 'product:price:amount') ?? extractMetaTag(html, 'price:amount');
  const ogCurrency =
    extractMetaTag(html, 'product:price:currency') ?? extractMetaTag(html, 'price:currency');
  if (ogPrice) {
    return { amount: ogPrice, currency: ogCurrency };
  }
  // 3. Regex fallback — only when a currency symbol or code precedes a number.
  const priceRegex =
    /(?:USD|EUR|GBP|JPY|CNY|\$|€|£|¥)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)|(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|EUR|GBP|JPY|CNY)$/i;
  const m = priceRegex.exec(html);
  if (m) {
    return { amount: m[1] ?? m[2] ?? null, currency: null };
  }
  return { amount: null, currency: null };
}

/** Normalize GTIN variations to the canonical 'gtin' key. */
function normalizeIdKey(key: string): string {
  return key === 'gtin13' || key === 'gtin8' ? 'gtin' : key;
}

/** Extract SKU / GTIN / UPC / MPN / ISBN identifiers from JSON-LD. */
function extractIdentifiers(jsonLd: Record<string, unknown> | null): Record<string, string> {
  const ids: Record<string, string> = {};
  if (!jsonLd) return ids;
  for (const key of ['sku', 'gtin', 'gtin13', 'gtin8', 'upc', 'mpn', 'isbn']) {
    const v = jsonLd[key];
    if (typeof v === 'string' && v.trim()) ids[normalizeIdKey(key)] = v.trim();
  }
  return ids;
}

/** Extract description from JSON-LD then OpenGraph. */
function extractDescription(jsonLd: Record<string, unknown> | null, html: string): string {
  if (jsonLd && typeof jsonLd['description'] === 'string' && jsonLd['description'].trim()) {
    return (jsonLd['description'] as string).trim();
  }
  return extractMetaTag(html, 'og:description') ?? '';
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

/**
 * Normalize a schema.org availability URL or a plain word into a canonical
 * availability term understood by `normalizeAvailability`. Handles both
 * "https://schema.org/InStock" and the bare "InStock" form.
 */
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

/** Compute per-field confidence scores (0.0–1.0) with warnings. */
function scoreHtmlFields(
  jsonLd: Record<string, unknown> | null,
  title: string,
  description: string,
  images: string[],
  price: { amount: string | null; currency: string | null },
  identifiers: Record<string, string>,
): { field: string; score: number; warnings: string[] }[] {
  const hasJsonLd = jsonLd !== null;
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
      field: 'json_ld',
      score: hasJsonLd ? 1 : 0.3,
      warnings: !hasJsonLd
        ? ['No JSON-LD structured data found; fell back to meta-tag extraction']
        : [],
    },
  ];
}
/**
 * HtmlProductAdapter — Stage 2 real HTML adapter.
 *
 * Implements ISupplierAdapter over a public product-page URL. Fetches the
 * page HTML and extracts product data via JSON-LD → OpenGraph → meta-tag
 * fallbacks. No network in unit tests: pass a `fetcher` to the constructor.
 *
 * @agent:atlas Supplement with a dedicated marketplace API adapter
 * (e.g. AliExpress Open Platform) once credentials are available.
 */
export class HtmlProductAdapter implements ISupplierAdapter {
  readonly adapterId = 'html';

  private readonly fetcher: (url: string) => Promise<string>;

  constructor(fetcher?: (url: string) => Promise<string>) {
    this.fetcher =
      fetcher ??
      (async (url: string) => {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'GhostCart/1.0 (+product-import-bot)' },
        });
        if (!res.ok) {
          throw new Error(`Product page returned HTTP ${res.status}`);
        }
        return res.text();
      });
  }

  /** Load raw HTML for a product page URL. */
  async loadHtml(url: string): Promise<string> {
    return this.fetcher(url);
  }

  async validateConnection(): Promise<{ valid: boolean; reason?: string }> {
    return { valid: true, reason: 'HTML adapter is universal — no connection test required' };
  }

  async importProduct(url: string, tenantId: string): Promise<CanonicalProduct> {
    const html = await this.loadHtml(url);
    const jsonLd = extractJsonLdProduct(html);

    const title =
      (jsonLd?.['name'] as string | undefined)?.trim() ||
      extractMetaTag(html, 'og:title') ||
      extractTitle(html);

    if (!title) {
      throw new Error('Could not extract a product title — verify the URL is a product page');
    }

    const description = extractDescription(jsonLd, html);
    const images = extractImages(html, jsonLd, url);
    const price = extractPrice(html, jsonLd);
    const identifiers = extractIdentifiers(jsonLd);
    const availability = normalizeAvailability(extractAvailability(jsonLd, html));
    const priceCents = price.amount ? priceToMinorUnits(price.amount) : null;
    const currency = price.currency || 'USD';

    // Strip the hash fragment for a stable source URL (dedupe key).
    const sourceUrl = url.replace(/#.*$/, '');

    const confidence = scoreHtmlFields(jsonLd, title, description, images, price, identifiers);
    const completeness = Math.round(
      (confidence.reduce((sum, c) => sum + c.score, 0) / confidence.length) * 100,
    ) / 100;

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
      rawSourceMetadata: {
        adapter: 'html',
        originalUrl: url,
        jsonLd: jsonLd ?? undefined,
      },
      confidence,
      importedAt: new Date().toISOString(),
      lastRefreshedAt: null,
      importDurationMs: null,
      normalizationCompleteness: completeness,
    };
  }

  async fetchProduct(productId: string, tenantId: string): Promise<CanonicalProduct> {
    // Decode the source URL from the deterministic product ID.
    const prefix = 'product_';
    if (productId.startsWith(prefix)) {
      try {
        const decoded = Buffer.from(productId.slice(prefix.length), 'base64url').toString('utf8');
        if (decoded.startsWith('http')) {
          return this.importProduct(decoded, tenantId);
        }
      } catch {
        // fall through
      }
    }
    // Fallback: treat the product ID as a URL.
    if (productId.startsWith('http')) {
      return this.importProduct(productId, tenantId);
    }
    throw new Error(`Cannot resolve source URL for product ID: ${productId}`);
  }
}

/** Default HTML adapter instance for factory registration. */
export const htmlAdapter = new HtmlProductAdapter();