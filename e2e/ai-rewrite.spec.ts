/**
 * AI Rewrite E2E Test
 *
 * Tests AI-assisted listing rewrite workflow.
 */

import { test, expect } from '@playwright/test';

test.describe('AI Rewrite Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a product detail page
    await page.goto('/products/00000000-0000-0000-0000-000000000001');
  });

  test('should generate AI rewrite for listing', async ({ page }) => {
    // Click AI rewrite button
    await page.click('[data-testid="ai-rewrite-button"]');

    // Wait for AI response
    await expect(page.locator('[data-testid="ai-rewrite-loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-rewrite-loading"]')).toBeHidden();

    // Verify rewrite was generated
    await expect(page.locator('[data-testid="ai-rewrite-result"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-rewrite-title"]')).not.toBeEmpty();
    await expect(page.locator('[data-testid="ai-rewrite-description"]')).not.toBeEmpty();
  });

  test('should preserve original content', async ({ page }) => {
    // Get original title
    const originalTitle = await page.locator('[data-testid="product-title"]').textContent();

    // Click AI rewrite button
    await page.click('[data-testid="ai-rewrite-button"]');

    // Wait for AI response
    await expect(page.locator('[data-testid="ai-rewrite-result"]')).toBeVisible();

    // Verify original content is still visible
    await expect(page.locator('[data-testid="original-title"]')).toContainText(originalTitle || '');
  });

  test('should use cached rewrite on second request', async ({ page }) => {
    // First request
    await page.click('[data-testid="ai-rewrite-button"]');
    await expect(page.locator('[data-testid="ai-rewrite-result"]')).toBeVisible();
    const firstRewrite = await page.locator('[data-testid="ai-rewrite-title"]').textContent();

    // Refresh page
    await page.reload();

    // Second request
    await page.click('[data-testid="ai-rewrite-button"]');
    await expect(page.locator('[data-testid="ai-rewrite-result"]')).toBeVisible();
    const secondRewrite = await page.locator('[data-testid="ai-rewrite-title"]').textContent();

    // Should be cached (same content)
    expect(firstRewrite).toBe(secondRewrite);
    await expect(page.locator('[data-testid="cache-indicator"]')).toContainText('cached');
  });

  test('should allow customizing rewrite style', async ({ page }) => {
    // Click AI rewrite button
    await page.click('[data-testid="ai-rewrite-button"]');

    // Select style
    await page.selectOption('[data-testid="rewrite-style"]', 'premium');

    // Regenerate
    await page.click('[data-testid="regenerate-rewrite"]');

    // Wait for new rewrite
    await expect(page.locator('[data-testid="ai-rewrite-result"]')).toBeVisible();

    // Verify style was applied
    await expect(page.locator('[data-testid="rewrite-style-applied"]')).toContainText('premium');
  });

  test('should handle AI service unavailability', async ({ page }) => {
    // Mock AI service failure (this would require test setup)
    // For now, test the error handling UI

    // Click AI rewrite button
    await page.click('[data-testid="ai-rewrite-button"]');

    // Wait for error message
    await expect(page.locator('[data-testid="ai-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-error"]')).toContainText('AI service unavailable');
  });
});
