import { test, expect } from '@playwright/test';

test.describe('Team Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'mock-token');
      localStorage.setItem('userData', JSON.stringify({ name: 'Admin', email: 'admin@sarai.ai', role: 'ADMIN' }));
    });
  });

  test('should display team members list', async ({ page }) => {
    await page.goto('/team');
    await expect(page.locator('text=Team Management')).toBeVisible();
    await expect(page.locator('text=Joined')).toBeVisible();
  });

  test('should display invite member modal', async ({ page }) => {
    await page.goto('/team');
    const inviteBtn = page.locator('text=Invite Member').first();
    if (await inviteBtn.isVisible()) {
      await inviteBtn.click();
      await expect(page.locator('text=Undang Anggota Tim')).toBeVisible();
    }
  });
});
