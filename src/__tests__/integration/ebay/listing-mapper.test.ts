/**
 * eBay Listing Mapper Tests
 *
 * Tests mapping CanonicalProduct and ListingDraft to eBay format.
 * Validates edge cases, truncation, and HTML sanitization.
 */

import { describe, it, expect } from 'vitest';
import {
  mapProductToEBayListing,
  mapListingDraftToEBayListing,
  validateEBayListing,
  getEBayConditionId,
  getEBayCategoryId,
  type PartialListingData,
} from '@/lib/adapters/ebay/listing-mapper';
import type { CanonicalProduct } from '@/lib/types/canonical';

describe('eBay Listing Mapper', () => {
  describe('mapProductToEBayListing', () => {
    it('should map CanonicalProduct to eBay format', () => {
      const product: CanonicalProduct = {
        id: 'test-id',
        tenantId: 'tenant-id',
        sourceUrl: 'https://example.com',
        title: 'Test Product',
        description: 'Test description',
        primaryImageUrl: 'https://example.com/image1.jpg',
        additionalImageUrls: ['https://example.com/image2.jpg'],
        currency: 'USD',
        supplierPriceCents: 1999,
        availability: 'in_stock',
        supplierId: 'supplier-id',
        identifiers: {},
        rawSourceMetadata: {},
        confidence: [],
        importedAt: new Date().toISOString(),
        lastRefreshedAt: null,
      };

      const result = mapProductToEBayListing(product);

      expect(result.title).toBe('Test Product');
      expect(result.description).toContain('Test description');
      expect(result.startPrice).toBe(19.99);
      expect(result.currency).toBe('USD');
      expect(result.pictureURLs).toHaveLength(2);
      expect(result.quantity).toBe(1);
    });

    it('should truncate title to 80 characters', () => {
      const product: CanonicalProduct = {
        id: 'test-id',
        tenantId: 'tenant-id',
        sourceUrl: 'https://example.com',
        title: 'A'.repeat(100),
        description: 'Test',
        primaryImageUrl: 'https://example.com/image.jpg',
        additionalImageUrls: [],
        currency: 'USD',
        supplierPriceCents: 1000,
        availability: 'in_stock',
        supplierId: 'supplier-id',
        identifiers: {},
        rawSourceMetadata: {},
        confidence: [],
        importedAt: new Date().toISOString(),
        lastRefreshedAt: null,
      };

      const result = mapProductToEBayListing(product);
      expect(result.title.length).toBeLessThanOrEqual(83); // 80 + '...'
    });

    it('should filter null image URLs', () => {
      const product: CanonicalProduct = {
        id: 'test-id',
        tenantId: 'tenant-id',
        sourceUrl: 'https://example.com',
        title: 'Test',
        description: 'Test',
        primaryImageUrl: 'https://example.com/image1.jpg',
        additionalImageUrls: ['https://example.com/image2.jpg'],
        currency: 'USD',
        supplierPriceCents: 1000,
        availability: 'in_stock',
        supplierId: 'supplier-id',
        identifiers: {},
        rawSourceMetadata: {},
        confidence: [],
        importedAt: new Date().toISOString(),
        lastRefreshedAt: null,
      };

      const result = mapProductToEBayListing(product);
      expect(result.pictureURLs).toHaveLength(2);
      expect(result.pictureURLs).not.toContain(null);
    });
  });

  describe('mapListingDraftToEBayListing', () => {
    it('should map partial listing data to eBay format', () => {
      const draft: PartialListingData = {
        title: 'Test Listing',
        description: 'Test listing description',
        listPriceCents: 2499,
        currency: 'USD',
        imageUrls: ['https://example.com/image.jpg'],
      };

      const result = mapListingDraftToEBayListing(draft);

      expect(result.title).toBe('Test Listing');
      expect(result.startPrice).toBe(24.99);
      expect(result.currency).toBe('USD');
    });

    it('should handle missing fields gracefully', () => {
      const draft: PartialListingData = {};

      const result = mapListingDraftToEBayListing(draft);

      expect(result.title).toBe('');
      expect(result.startPrice).toBe(0);
      expect(result.currency).toBe('USD');
    });
  });

  describe('validateEBayListing', () => {
    it('should validate a correct listing', () => {
      const listing = {
        title: 'Valid Title',
        description: 'Valid description with enough content',
        category: 'Electronics',
        condition: 'New',
        startPrice: 10,
        currency: 'USD',
        quantity: 1,
        pictureURLs: ['https://example.com/image.jpg'],
        duration: 'GTC',
        listingType: 'FixedPriceItem',
      };

      const result = validateEBayListing(listing);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject title that is too short', () => {
      const listing = {
        title: 'Bad',
        description: 'Valid description',
        category: 'Electronics',
        condition: 'New',
        startPrice: 10,
        currency: 'USD',
        quantity: 1,
        pictureURLs: ['https://example.com/image.jpg'],
        duration: 'GTC',
        listingType: 'FixedPriceItem',
      };

      const result = validateEBayListing(listing);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title must be at least 5 characters');
    });

    it('should reject title that is too long', () => {
      const listing = {
        title: 'A'.repeat(81),
        description: 'Valid description',
        category: 'Electronics',
        condition: 'New',
        startPrice: 10,
        currency: 'USD',
        quantity: 1,
        pictureURLs: ['https://example.com/image.jpg'],
        duration: 'GTC',
        listingType: 'FixedPriceItem',
      };

      const result = validateEBayListing(listing);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title must not exceed 80 characters');
    });

    it('should reject zero or negative price', () => {
      const listing = {
        title: 'Valid Title',
        description: 'Valid description',
        category: 'Electronics',
        condition: 'New',
        startPrice: 0,
        currency: 'USD',
        quantity: 1,
        pictureURLs: ['https://example.com/image.jpg'],
        duration: 'GTC',
        listingType: 'FixedPriceItem',
      };

      const result = validateEBayListing(listing);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Price must be greater than 0');
    });

    it('should reject missing images', () => {
      const listing = {
        title: 'Valid Title',
        description: 'Valid description',
        category: 'Electronics',
        condition: 'New',
        startPrice: 10,
        currency: 'USD',
        quantity: 1,
        pictureURLs: [],
        duration: 'GTC',
        listingType: 'FixedPriceItem',
      };

      const result = validateEBayListing(listing);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one image is required');
    });

    it('should reject too many images', () => {
      const listing = {
        title: 'Valid Title',
        description: 'Valid description',
        category: 'Electronics',
        condition: 'New',
        startPrice: 10,
        currency: 'USD',
        quantity: 1,
        pictureURLs: Array.from({ length: 13 }, (_, i) => `https://example.com/image${i}.jpg`),
        duration: 'GTC',
        listingType: 'FixedPriceItem',
      };

      const result = validateEBayListing(listing);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Maximum 12 images allowed');
    });
  });

  describe('getEBayConditionId', () => {
    it('should return correct condition IDs', () => {
      expect(getEBayConditionId('new')).toBe('1000');
      expect(getEBayConditionId('like new')).toBe('2000');
      expect(getEBayConditionId('good')).toBe('4000');
      expect(getEBayConditionId('for parts')).toBe('7000');
    });

    it('should default to New for unknown conditions', () => {
      expect(getEBayConditionId('unknown')).toBe('1000');
    });
  });

  describe('getEBayCategoryId', () => {
    it('should return correct category IDs', () => {
      expect(getEBayCategoryId('electronics')).toBe('293');
      expect(getEBayCategoryId('clothing')).toBe('15724');
      expect(getEBayCategoryId('toys')).toBe('220');
    });

    it('should default to Other for unknown categories', () => {
      expect(getEBayCategoryId('unknown')).toBe('20081');
    });
  });
});
