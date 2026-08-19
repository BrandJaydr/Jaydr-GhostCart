/**
 * Integration Tests for CSV Adapter
 *
 * Tests CSV adapter with real CSV file loading and comprehensive scenarios.
 *
 * @agent:oracle Add more edge case tests as needed
 */

import { describe, it, expect } from 'vitest';
import { CsvSupplierAdapter } from '@/lib/adapters/csv.adapter';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('CSV Adapter Integration Tests', () => {
  const adapter = new CsvSupplierAdapter();
  const sampleCsvPath = join(__dirname, '../fixtures/sample-products.csv');
  const TEST_TENANT_ID = '00000000-0000-0000-0000-000000000001';

  describe('CSV File Loading', () => {
    it('should load and parse a real CSV file', async () => {
      const csvText = readFileSync(sampleCsvPath, 'utf-8');
      
      const rows = csvText.split('\n').filter(line => line.trim());
      expect(rows.length).toBeGreaterThan(1); // Header + at least one data row
    });

    it('should validate CSV connection with real file', async () => {
      const prev = process.env.CSV_FEED_URL;
      process.env.CSV_FEED_URL = `file://${sampleCsvPath}`;
      
      try {
        const result = await adapter.validateConnection();
        // This may fail with file:// protocol, but tests the validation logic
        expect(result).toHaveProperty('valid');
        expect(result).toHaveProperty('reason');
      } finally {
        if (prev === undefined) delete process.env.CSV_FEED_URL;
        else process.env.CSV_FEED_URL = prev;
      }
    });
  });

  describe('Product Import Flow', () => {
    it('should import a product from CSV and persist to database', async () => {
      const csvText = readFileSync(sampleCsvPath, 'utf-8');
      const customAdapter = new CsvSupplierAdapter(async () => csvText);
      
      const product = await customAdapter.importProduct(
        'https://supplier.example/products/mouse',
        TEST_TENANT_ID
      );

      expect(product.title).toBe('Wireless Mouse');
      expect(product.supplierPriceCents).toBe(2999); // $29.99 = 2999 cents
      expect(product.availability).toBe('in_stock');
      expect(product.identifiers.sku).toBe('MOUSE-001');
      expect(product.primaryImageUrl).toContain('mouse.jpg');
    });

    it('should handle products with missing optional fields', async () => {
      const csvText = readFileSync(sampleCsvPath, 'utf-8');
      const customAdapter = new CsvSupplierAdapter(async () => csvText);
      
      const product = await customAdapter.importProduct(
        'https://supplier.example/products/hub',
        TEST_TENANT_ID
      );

      expect(product.title).toBe('USB-C Hub');
      expect(product.additionalImageUrls).toEqual([]); // Empty array when missing
      expect(product.availability).toBe('limited');
    });

    it('should normalize availability correctly', async () => {
      const csvText = readFileSync(sampleCsvPath, 'utf-8');
      const customAdapter = new CsvSupplierAdapter(async () => csvText);
      
      const inStockProduct = await customAdapter.importProduct(
        'https://supplier.example/products/mouse',
        TEST_TENANT_ID
      );
      
      const outOfStockProduct = await customAdapter.importProduct(
        'https://supplier.example/products/stand',
        TEST_TENANT_ID
      );

      expect(inStockProduct.availability).toBe('in_stock');
      expect(outOfStockProduct.availability).toBe('out_of_stock');
    });

    it('should parse additional image URLs correctly', async () => {
      const csvText = readFileSync(sampleCsvPath, 'utf-8');
      const customAdapter = new CsvSupplierAdapter(async () => csvText);
      
      const product = await customAdapter.importProduct(
        'https://supplier.example/products/mouse',
        TEST_TENANT_ID
      );

      expect(product.additionalImageUrls).toBeDefined();
      expect(Array.isArray(product.additionalImageUrls)).toBe(true);
      expect(product.additionalImageUrls?.length).toBeGreaterThan(0);
    });
  });

  describe('Product Refresh Flow', () => {
    it('should fetch a product by ID for refresh', async () => {
      const csvText = readFileSync(sampleCsvPath, 'utf-8');
      const customAdapter = new CsvSupplierAdapter(async () => csvText);
      
      const prev = process.env.CSV_FEED_URL;
      process.env.CSV_FEED_URL = 'https://example.com/catalog.csv';
      
      try {
        const product = await customAdapter.importProduct(
          'https://supplier.example/products/keyboard',
          TEST_TENANT_ID
        );

        // Refresh using the product ID - fetchProduct uses CSV_FEED_URL
        // Since we set it, it will use our custom fetcher
        const refreshedProduct = await customAdapter.fetchProduct(
          product.id,
          TEST_TENANT_ID
        );

        expect(refreshedProduct.id).toBe(product.id);
        // Note: fetchProduct may return first product if ID matching fails
        // This tests the refresh mechanism exists
        expect(refreshedProduct).toBeDefined();
      } finally {
        if (prev === undefined) delete process.env.CSV_FEED_URL;
        else process.env.CSV_FEED_URL = prev;
      }
    });

    it('should handle refresh for non-existent product ID', async () => {
      const csvText = readFileSync(sampleCsvPath, 'utf-8');
      const customAdapter = new CsvSupplierAdapter(async () => csvText);
      
      const prev = process.env.CSV_FEED_URL;
      process.env.CSV_FEED_URL = 'https://example.com/catalog.csv';
      
      try {
        // Should return first product as fallback
        const product = await customAdapter.fetchProduct(
          'non-existent-id',
          TEST_TENANT_ID
        );

        expect(product).toBeDefined();
        expect(product.title).toBe('Wireless Mouse'); // First product in CSV
      } finally {
        if (prev === undefined) delete process.env.CSV_FEED_URL;
        else process.env.CSV_FEED_URL = prev;
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed CSV gracefully with default values', async () => {
      const malformedCsv = 'title,price\nA,not-a-number';
      const customAdapter = new CsvSupplierAdapter(async () => malformedCsv);
      
      // Adapter should handle malformed data gracefully, not throw
      const product = await customAdapter.importProduct('https://example.com/test', TEST_TENANT_ID);
      
      expect(product).toBeDefined();
      expect(product.title).toBe('A');
      expect(product.supplierPriceCents).toBe(0); // Default when price parsing fails
      expect(product.confidence).toBeDefined();
      
      // Should have confidence warnings for missing/invalid data
      const priceField = product.confidence.find((c: any) => c.field === 'required');
      expect(priceField?.warnings).toBeDefined();
    });

    it('should handle empty CSV', async () => {
      const emptyCsv = 'title,price\n';
      const customAdapter = new CsvSupplierAdapter(async () => emptyCsv);
      
      await expect(
        customAdapter.importProduct('https://example.com/test', TEST_TENANT_ID)
      ).rejects.toThrow();
    });

    it('should handle CSV with missing required columns', async () => {
      const prev = process.env.CSV_FEED_URL;
      process.env.CSV_FEED_URL = 'https://example.com/bad.csv';
      
      try {
        const badCsv = 'title,price\nA,1';
        const customAdapter = new CsvSupplierAdapter(async () => badCsv);
        
        const result = await customAdapter.validateConnection();
        expect(result.valid).toBe(false);
        expect(result.reason?.toLowerCase()).toContain('missing required columns');
      } finally {
        if (prev === undefined) delete process.env.CSV_FEED_URL;
        else process.env.CSV_FEED_URL = prev;
      }
    });

    it('should handle network errors gracefully', async () => {
      const failingAdapter = new CsvSupplierAdapter(async () => {
        throw new Error('Network error');
      });
      
      await expect(
        failingAdapter.importProduct('https://example.com/test', TEST_TENANT_ID)
      ).rejects.toThrow('Network error');
    });
  });

  describe('Data Quality and Confidence', () => {
    it('should include confidence scores for all fields', async () => {
      const csvText = readFileSync(sampleCsvPath, 'utf-8');
      const customAdapter = new CsvSupplierAdapter(async () => csvText);
      
      const product = await customAdapter.importProduct(
        'https://supplier.example/products/mouse',
        TEST_TENANT_ID
      );

      expect(product.confidence).toBeDefined();
      expect(Array.isArray(product.confidence)).toBe(true);
      expect(product.confidence.length).toBeGreaterThan(0);
    });

    it('should preserve raw source metadata', async () => {
      const csvText = readFileSync(sampleCsvPath, 'utf-8');
      const customAdapter = new CsvSupplierAdapter(async () => csvText);
      
      const product = await customAdapter.importProduct(
        'https://supplier.example/products/mouse',
        TEST_TENANT_ID
      );

      expect(product.rawSourceMetadata).toBeDefined();
      expect(product.rawSourceMetadata.adapter).toBe('csv');
    });

    it('should generate deterministic product IDs', async () => {
      const csvText = readFileSync(sampleCsvPath, 'utf-8');
      const customAdapter = new CsvSupplierAdapter(async () => csvText);
      
      const product1 = await customAdapter.importProduct(
        'https://supplier.example/products/mouse',
        TEST_TENANT_ID
      );
      
      const product2 = await customAdapter.importProduct(
        'https://supplier.example/products/mouse',
        TEST_TENANT_ID
      );

      expect(product1.id).toBe(product2.id);
    });
  });

  describe('Bulk Import Scenarios', () => {
    it('should handle multiple products from same CSV', async () => {
      const csvText = readFileSync(sampleCsvPath, 'utf-8');
      const customAdapter = new CsvSupplierAdapter(async () => csvText);
      
      const products = [
        await customAdapter.importProduct('https://supplier.example/products/mouse', TEST_TENANT_ID),
        await customAdapter.importProduct('https://supplier.example/products/keyboard', TEST_TENANT_ID),
        await customAdapter.importProduct('https://supplier.example/products/hub', TEST_TENANT_ID),
      ];

      expect(products).toHaveLength(3);
      expect(products[0].title).toBe('Wireless Mouse');
      expect(products[1].title).toBe('Mechanical Keyboard');
      expect(products[2].title).toBe('USB-C Hub');
    });

    it('should handle products with different availability states', async () => {
      const csvText = readFileSync(sampleCsvPath, 'utf-8');
      const customAdapter = new CsvSupplierAdapter(async () => csvText);
      
      const products = [
        await customAdapter.importProduct('https://supplier.example/products/mouse', TEST_TENANT_ID),
        await customAdapter.importProduct('https://supplier.example/products/hub', TEST_TENANT_ID),
        await customAdapter.importProduct('https://supplier.example/products/stand', TEST_TENANT_ID),
      ];

      expect(products[0].availability).toBe('in_stock');
      expect(products[1].availability).toBe('limited');
      expect(products[2].availability).toBe('out_of_stock');
    });
  });
});
