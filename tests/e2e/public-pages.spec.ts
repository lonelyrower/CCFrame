import { test, expect } from '@playwright/test';

test.describe('Public Pages', () => {
  test('homepage should load successfully', async ({ page }) => {
    await page.goto('/');

    // Check page loads
    await expect(page).toHaveTitle(/CCFrame/i);

    // Check for main content area
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('homepage should display navigation', async ({ page }) => {
    await page.goto('/');

    // Check for header/navigation
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('photos page should load', async ({ page }) => {
    await page.goto('/photos');

    // Should show the photos page
    await expect(page).toHaveURL('/photos');
  });

  test('tags page should load', async ({ page }) => {
    await page.goto('/tags');

    await expect(page).toHaveURL('/tags');
  });

  test('series page should load', async ({ page }) => {
    await page.goto('/series');

    await expect(page).toHaveURL('/series');
  });

  test('albums page should redirect or load properly', async ({ page }) => {
    const response = await page.goto('/albums');

    // Should get a successful response (2xx or redirect)
    expect(response?.status()).toBeLessThan(400);
  });
});
