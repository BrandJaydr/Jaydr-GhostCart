/**
 * Import Workflow E2E Test
 *
 * Tests the complete product import workflow from URL to library.
 */

import { test, expect } from '@playwright/test';

test.describe('Product Import Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to import page
    await page.goto('/import');
  });

  test('should import product from valid URL', async ({ page }) => {
    // Fill in product URL
    await page.fill('input[name="url"]', 'https://example.com/product/test');

    // Submit import
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator('[data-testid="import-success"]')).toBeVisible();

    // Navigate to products library
    await page.goto('/products');

    // Verify product appears in library
    await expect(page.locator('[data-testid="product-list"]')).toContainText('Test Product');
  });

  test('should show error for invalid URL', async ({ page }) => {
    // Fill in invalid URL
    await page.fill('input[name="url"]', 'not-a-valid-url');

    // Submit import
    await page.click('button[type="submit"]');

    // Verify error message
    await expect(page.locator('[data-testid="import-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-error"]')).toContainText('Invalid URL');
  });

  test('should create audit event on import', async ({ page }) => {
    // Fill in product URL
    await page.fill('input[name="url"]', 'https://example.com/product/test');

    // Submit import
    await page.click('button[type="submit"]');

    // Wait for success
    await expect(page.locator('[data-testid="import-success"]')).toBeVisible();

    // Navigate to activity history
    await page.goto('/jobs/activity');

    // Verify audit event was created
    await expect(page.locator('[data-testid="activity-list"]')).toContainText('product.import');
  });

  test('should handle duplicate product detection', async ({ page }) => {
    // Import product first time
    await page.fill('input[name="url"]', 'https://example.com/product/test');
    await page.click('button[type="submit"]');
    await expect(page.locator('[data-testid="import-success"]')).toBeVisible();

    // Try to import same product again
    await page.goto('/import');
    await page.fill('input[name="url"]', 'https://example.com/product/test');
    await page.click('button[type="submit"]');

    // Verify duplicate warning
    await expect(page.locator('[data-testid="duplicate-warning"]')).toBeVisible();
  });
});
