/**
 * eBay Listing Mapper
 *
 * Maps CanonicalProduct and ListingDraft to eBay Trading API format.
 * Handles eBay-specific field transformations and validation.
 *
 * @agent:oracle Add tests for mapping edge cases
 */

import type { CanonicalProduct, ListingDraft } from '@/lib/types/canonical';
import type { ListingItem } from './ebay-client';

export interface MappingOptions {
  category?: string;
  condition?: string;
  listingType?: 'FixedPriceItem' | 'Chinese' | 'StoresFixedPrice';
  duration?: string;
  includeBrand?: boolean;
}

/**
 * Map CanonicalProduct to eBay ListingItem
 */
export function mapProductToEBayListing(
  product: CanonicalProduct,
  options: MappingOptions = {},
): ListingItem {
  const {
    category = 'Other',
    condition = 'New',
    listingType = 'FixedPriceItem',
    duration = 'GTC', // Good 'Til Cancelled
    includeBrand = false,
  } = options;

  // Truncate title to eBay's 80 character limit
  const title = truncateTitle(product.title, 80);

  // Sanitize and format description for eBay
  const description = formatDescription(product.description);

  // Extract image URLs
  const pictureURLs = [product.primaryImageUrl, ...product.additionalImageUrls].filter((url): url is string => Boolean(url));

  return {
    title,
    description,
    category,
    condition,
    startPrice: product.supplierPriceCents / 100, // Convert cents to dollars
    currency: product.currency,
    quantity: 1, // Default to 1 for single item
    pictureURLs,
    duration,
    listingType,
  };
}

/**
 * Partial type for listing data needed for eBay mapping
 */
export interface PartialListingData {
  title?: string;
  description?: string;
  listPriceCents?: number;
  currency?: string;
  imageUrls?: string[];
}

/**
 * Map ListingDraft to eBay ListingItem
 */
export function mapListingDraftToEBayListing(
  draft: ListingDraft | PartialListingData,
  options: MappingOptions = {},
): ListingItem {
  const {
    category = 'Other',
    condition = 'New',
    listingType = 'FixedPriceItem',
    duration = 'GTC',
  } = options;

  const title = truncateTitle(draft.title || '', 80);
  const description = formatDescription(draft.description || '');
  const pictureURLs = draft.imageUrls || [];

  return {
    title,
    description,
    category,
    condition,
    startPrice: (draft.listPriceCents || 0) / 100,
    currency: draft.currency || 'USD',
    quantity: 1,
    pictureURLs,
    duration,
    listingType,
  };
}

/**
 * Truncate title to eBay's 80 character limit
 * Preserves important keywords at the end
 */
function truncateTitle(title: string, maxLength: number): string {
  if (title.length <= maxLength) {
    return title;
  }

  // Try to truncate at word boundary
  const truncated = title.substring(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Format description for eBay HTML requirements
 * - Sanitize HTML
 * - Add basic formatting
 * - Ensure mobile-friendly
 */
function formatDescription(description: string): string {
  // Remove any existing HTML tags
  const plainText = description.replace(/<[^>]*>/g, '');

  // Basic HTML formatting
  let formatted = plainText
    .split('\n\n')
    .map((paragraph) => `<p>${paragraph.trim()}</p>`)
    .join('');

  // Add bullet points for lists
  formatted = formatted.replace(
    /^- (.+)$/gm,
    '<li>$1</li>',
  );
  formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  return formatted;
}

/**
 * Validate eBay listing requirements
 */
export function validateEBayListing(item: ListingItem): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!item.title || item.title.length < 5) {
    errors.push('Title must be at least 5 characters');
  }

  if (item.title.length > 80) {
    errors.push('Title must not exceed 80 characters');
  }

  if (!item.description || item.description.length < 10) {
    errors.push('Description must be at least 10 characters');
  }

  if (!item.category) {
    errors.push('Category is required');
  }

  if (!item.condition) {
    errors.push('Condition is required');
  }

  if (item.startPrice <= 0) {
    errors.push('Price must be greater than 0');
  }

  if (!item.currency || item.currency.length !== 3) {
    errors.push('Currency must be a valid 3-letter code');
  }

  if (item.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }

  if (!item.pictureURLs || item.pictureURLs.length === 0) {
    errors.push('At least one image is required');
  }

  if (item.pictureURLs.length > 12) {
    errors.push('Maximum 12 images allowed');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get eBay condition ID from condition name
 */
export function getEBayConditionId(condition: string): string {
  const conditionMap: Record<string, string> = {
    'new': '1000',
    'new with tags': '1000',
    'new without tags': '1500',
    'new with defects': '1750',
    'like new': '2000',
    'open box': '2010',
    'certified refurbished': '2020',
    'excellent - refurbished': '2030',
    'very good': '3000',
    'good': '4000',
    'acceptable': '5000',
    'salvage': '7000',
    'for parts': '7000',
  };

  const normalized = condition.toLowerCase().trim();
  return conditionMap[normalized] || '1000'; // Default to New
}

/**
 * Get eBay category ID from category name
 * Note: This is a simplified mapping. In production, use eBay's Category API.
 */
export function getEBayCategoryId(category: string): string {
  const categoryMap: Record<string, string> = {
    'electronics': '293',
    'clothing': '15724',
    'home': '11700',
    'garden': '631',
    'toys': '220',
    'sports': '888',
    'automotive': '6000',
    'books': '267',
    'music': '11233',
    'collectibles': '1',
    'other': '20081',
  };

  const normalized = category.toLowerCase().trim();
  return categoryMap[normalized] || '20081'; // Default to Other
}
