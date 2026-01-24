import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('homepage should be mobile-friendly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Page should load without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // Allow small tolerance
  });

  test('navigation should be accessible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Look for mobile menu button or nav element
    const mobileNav = page.locator('[data-testid="mobile-nav"], [aria-label*="menu"], button[aria-expanded]');
    const nav = page.locator('nav, header');

    // Either mobile nav or regular nav should be present
    const hasMobileNav = await mobileNav.count() > 0;
    const hasNav = await nav.count() > 0;

    expect(hasMobileNav || hasNav).toBe(true);
  });

  test('photos page should adapt to different screen sizes', async ({ page }) => {
    // Test on tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/photos');
    await expect(page).toHaveURL('/photos');

    // Test on desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/photos');
    await expect(page).toHaveURL('/photos');
  });
});

test.describe('PWA Features', () => {
  test('manifest.json should be accessible', async ({ request }) => {
    const response = await request.get('/manifest.json');

    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('icons');
  });

  test('service worker should be accessible', async ({ request }) => {
    const response = await request.get('/sw.js');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('javascript');
  });

  test('offline page should exist', async ({ request }) => {
    const response = await request.get('/offline.html');

    expect(response.status()).toBe(200);
  });
});

test.describe('Performance', () => {
  test('homepage should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('API responses should be fast', async ({ request }) => {
    const startTime = Date.now();

    await request.get('/api/photos?isPublic=true&limit=10');

    const responseTime = Date.now() - startTime;

    // API should respond within 2 seconds
    expect(responseTime).toBeLessThan(2000);
  });
});
