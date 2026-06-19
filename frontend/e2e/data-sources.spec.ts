import { test, expect } from '@playwright/test';

test.describe('Data Sources Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'mock-token');
      localStorage.setItem('userData', JSON.stringify({ name: 'Admin', email: 'admin@sarai.ai', role: 'ADMIN' }));
    });
  });

  test('should render data sources list', async ({ page }) => {
    await page.goto('/data-sources');
    await expect(page.locator('text=Data Sources').first()).toBeVisible();
  });

  test('should navigate to add data source wizard', async ({ page }) => {
    await page.goto('/data-sources');
    const addBtn = page.locator('text=Add Data Source').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForURL('**/data-sources/add');
    } else {
      await page.goto('/data-sources/add');
    }
    await expect(page.locator('text=Select Data Source Connector')).toBeVisible();
  });
});
