import { test, expect } from '@playwright/test';

test.describe('Dashboard Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Inject auth token
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'mockHeader.eyJuYW1lIjoiQWRtaW4iLCJlbWFpbCI6ImFkbWluQHNhcmFpLmFpIiwicm9sZSI6IkFETUlOIiwiZXhwIjo5OTk5OTk5OTk5fQ.mockSignature');
      localStorage.setItem('userData', JSON.stringify({ name: 'Admin', email: 'admin@sarai.ai', role: 'ADMIN' }));
      document.cookie = "isLoggedIn=true; path=/";
    });
  });

  test('should render quick stats cards', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('text=Active Sources')).toBeVisible();
    await expect(page.locator('text=Nodes Online')).toBeVisible();
    await expect(page.locator('text=System Alerts')).toBeVisible();
  });

  test('should load charts in dashboard canvas', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('text=Data Ingestion Traffic')).toBeVisible();
    await expect(page.locator('text=Query Performance Trend')).toBeVisible();
  });
});
