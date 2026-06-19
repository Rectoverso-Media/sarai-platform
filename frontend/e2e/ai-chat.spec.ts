import { test, expect } from '@playwright/test';

test.describe('AI Chat Assistant', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'mock-token');
      localStorage.setItem('userData', JSON.stringify({ name: 'Admin', email: 'admin@sarai.ai', role: 'ADMIN' }));
    });
  });

  test('should load chat room interface', async ({ page }) => {
    await page.goto('/ai-chat');
    await expect(page.locator('text=AI Chat Assistant')).toBeVisible();
    await expect(page.locator('input[placeholder*="Tanyakan"]')).toBeVisible();
  });
});
