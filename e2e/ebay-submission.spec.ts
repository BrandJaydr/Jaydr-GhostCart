/**
 * eBay Submission E2E Test
 *
 * Tests eBay listing submission workflow.
 */

import { test, expect } from '@playwright/test';

test.describe('eBay Submission Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to listing draft page
    await page.goto('/listings/00000000-0000-0000-0000-000000000001');
  });

  test('should submit listing to eBay sandbox', async ({ page }) => {
    // Click submit to eBay button
    await page.click('[data-testid="ebay-submit-button"]');

    // Wait for submission confirmation
    await expect(page.locator('[data-testid="submission-loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="submission-loading"]')).toBeHidden();

    // Verify success message
    await expect(page.locator('[data-testid="submission-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="submission-success"]')).toContainText('submitted to eBay');

    // Verify eBay item ID is displayed
    await expect(page.locator('[data-testid="ebay-item-id"]')).toBeVisible();
  });

  test('should validate listing before submission', async ({ page }) => {
    // Remove required field (title)
    await page.fill('[data-testid="listing-title"]', '');

    // Click submit button
    await page.click('[data-testid="ebay-submit-button"]');

    // Verify validation error
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('Title is required');
  });

  test('should update listing state after submission', async ({ page }) => {
    // Get initial state
    const initialState = await page.locator('[data-testid="listing-state"]').textContent();

    // Submit to eBay
    await page.click('[data-testid="ebay-submit-button"]');
    await expect(page.locator('[data-testid="submission-success"]')).toBeVisible();

    // Verify state changed to 'submitted'
    const newState = await page.locator('[data-testid="listing-state"]').textContent();
    expect(newState).toBe('submitted');
    expect(initialState).not.toBe(newState);
  });

  test('should create audit event on submission', async ({ page }) => {
    // Submit to eBay
    await page.click('[data-testid="ebay-submit-button"]');
    await expect(page.locator('[data-testid="submission-success"]')).toBeVisible();

    // Navigate to activity history
    await page.goto('/jobs/activity');

    // Verify audit event was created
    await expect(page.locator('[data-testid="activity-list"]')).toContainText('listing.submitted');
    await expect(page.locator('[data-testid="activity-list"]')).toContainText('ebay');
  });

  test('should handle eBay authorization requirement', async ({ page }) => {
    // Mock unauthorized state (would require test setup)
    // For now, test the authorization flow UI

    // Click submit button
    await page.click('[data-testid="ebay-submit-button"]');

    // Verify authorization prompt
    await expect(page.locator('[data-testid="auth-required"]')).toBeVisible();
    await expect(page.locator('[data-testid="auth-required"]')).toContainText('Authorize eBay');

    // Click authorize button
    await page.click('[data-testid="authorize-ebay"]');

    // Verify redirect to eBay OAuth
    await expect(page).toHaveURL(/ebay\.com/);
  });

  test('should use CSV export when API unavailable', async ({ page }) => {
    // Click CSV export button
    await page.click('[data-testid="csv-export-button"]');

    // Wait for download
    const downloadPromise = page.waitForEvent('download');
    await downloadPromise;

    // Verify file was downloaded
    const downloads = await page.locator('[data-testid="download-link"]').all();
    expect(downloads.length).toBeGreaterThan(0);
  });
});
