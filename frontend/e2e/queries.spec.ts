import { test, expect } from '@playwright/test';

test.describe('SQL Queries Builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'mock-token');
      localStorage.setItem('userData', JSON.stringify({ name: 'Admin', email: 'admin@sarai.ai', role: 'ADMIN' }));
    });
  });

  test('should display queries list page', async ({ page }) => {
    await page.goto('/queries');
    await expect(page.locator('text=Saved Queries').first()).toBeVisible();
  });

  test('should display query builder layout', async ({ page }) => {
    await page.goto('/queries/builder');
    await expect(page.locator('text=SQL Query Builder')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="SELECT"]')).toBeVisible();
  });
});
