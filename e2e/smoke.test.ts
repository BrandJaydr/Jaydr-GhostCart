import { test, expect } from '@playwright/test';

/**
 * GhostCart — Stage 1 Smoke Test
 *
 * Covers: sign-in page renders correctly.
 * This is the required one browser-level smoke test for Stage 1 gate.
 *
 * TODO: @agent:forge (Stage 2) Expand to full happy path: sign-in → import → review → draft
 * TODO: @agent:forge (Stage 2) Add one failure state test (invalid sign-in credentials)
 *
 * Reference: Production Blueprint §Stage 1 Test Gate:
 * "One browser-level smoke test covers the happy path and one failure state."
 */
test.describe('Stage 1 Smoke — Sign-In Screen', () => {
  test('sign-in page renders and has correct title', async ({ page }) => {
    await page.goto('/sign-in');

    // Page title is set
    await expect(page).toHaveTitle(/Sign In/i);

    // H1 heading is visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('sign-in page has accessible main landmark', async ({ page }) => {
    await page.goto('/sign-in');

    // Accessible main region exists (required for keyboard navigation)
    await expect(page.getByRole('main')).toBeVisible();
  });
});

test.describe('Stage 1 Smoke — Health Check', () => {
  test('API health endpoint returns 200 OK', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ok');
  });
});
