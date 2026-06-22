import { test, expect } from '@playwright/test';

test.describe('SQL Queries Builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'mockHeader.eyJuYW1lIjoiQWRtaW4iLCJlbWFpbCI6ImFkbWluQHNhcmFpLmFpIiwicm9sZSI6IkFETUlOIiwiZXhwIjo5OTk5OTk5OTk5fQ.mockSignature');
      localStorage.setItem('userData', JSON.stringify({ name: 'Admin', email: 'admin@sarai.ai', role: 'ADMIN' }));
      document.cookie = "isLoggedIn=true; path=/";
    });
  });

  test('should display queries list page', async ({ page }) => {
    await page.goto('/queries');
    await expect(page.locator('text=Saved Queries').first()).toBeVisible();
  });

  test('should display query builder layout', async ({ page }) => {
    await page.goto('/queries/builder');
    await expect(page.locator('text=Query Builder')).toBeVisible();
    await expect(page.locator('textarea').first()).toBeVisible();
  });
});
