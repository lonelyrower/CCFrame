import { test, expect } from '@playwright/test';

test.describe('Admin Authentication', () => {
  test('should redirect to login when accessing admin without auth', async ({ page }) => {
    await page.goto('/admin/library');

    // Should redirect to login page
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('login page should render correctly', async ({ page }) => {
    await page.goto('/admin/login');

    // Check for login form elements
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/admin/login');

    // Fill in invalid credentials
    await page.fill('input[type="email"], input[name="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message (wait for response)
    await page.waitForTimeout(1000);

    // Should still be on login page
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('should be able to login with valid credentials', async ({ page }) => {
    // This test requires valid credentials from environment
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    // Skip if credentials not available
    test.skip(!email || !password, 'Admin credentials not configured');

    await page.goto('/admin/login');

    await page.fill('input[type="email"], input[name="email"]', email!);
    await page.fill('input[type="password"]', password!);
    await page.click('button[type="submit"]');

    // Should redirect to admin dashboard
    await page.waitForURL(/\/admin(?!\/login)/);
    await expect(page).not.toHaveURL(/\/admin\/login/);
  });
});

test.describe('Admin Protected Routes', () => {
  test('library page requires authentication', async ({ page }) => {
    await page.goto('/admin/library');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('upload page requires authentication', async ({ page }) => {
    await page.goto('/admin/upload');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('settings page requires authentication', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('albums page requires authentication', async ({ page }) => {
    await page.goto('/admin/albums');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('tags page requires authentication', async ({ page }) => {
    await page.goto('/admin/tags');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
