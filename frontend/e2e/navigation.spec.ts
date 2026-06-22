import { test, expect } from '@playwright/test';

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'mockHeader.eyJuYW1lIjoiQWRtaW4iLCJlbWFpbCI6ImFkbWluQHNhcmFpLmFpIiwicm9sZSI6IkFETUlOIiwiZXhwIjo5OTk5OTk5OTk5fQ.mockSignature');
      localStorage.setItem('userData', JSON.stringify({ name: 'Admin', email: 'admin@sarai.ai', role: 'ADMIN' }));
      document.cookie = "isLoggedIn=true; path=/";
    });
  });

  test('should navigate to queries from sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    const queryLink = page.locator('text=Queries').first();
    await queryLink.click();
    await page.waitForURL('**/queries');
    await expect(page).toHaveURL(/.*queries/);
  });

  test('should navigate to settings from sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    const settingsLink = page.locator('text=Settings').first();
    await settingsLink.click();
    await page.waitForURL('**/settings');
    await expect(page).toHaveURL(/.*settings/);
  });
});
