import { test, expect } from '@playwright/test';

test.describe('Dashboard Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Inject auth token
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'mock-token');
      localStorage.setItem('userData', JSON.stringify({ name: 'Admin', email: 'admin@sarai.ai', role: 'ADMIN' }));
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
