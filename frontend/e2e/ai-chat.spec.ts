import { test, expect } from '@playwright/test';

test.describe('AI Chat Assistant', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'mockHeader.eyJuYW1lIjoiQWRtaW4iLCJlbWFpbCI6ImFkbWluQHNhcmFpLmFpIiwicm9sZSI6IkFETUlOIiwiZXhwIjo5OTk5OTk5OTk5fQ.mockSignature');
      localStorage.setItem('userData', JSON.stringify({ name: 'Admin', email: 'admin@sarai.ai', role: 'ADMIN' }));
      document.cookie = "isLoggedIn=true; path=/";
    });
  });

  test('should load chat room interface', async ({ page }) => {
    await page.goto('/ai-chat');
    await expect(page.locator('text=SARAI AI Assistant')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
  });
});
