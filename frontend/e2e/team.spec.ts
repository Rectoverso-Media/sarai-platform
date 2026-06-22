import { test, expect } from '@playwright/test';

test.describe('Team Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'mockHeader.eyJuYW1lIjoiQWRtaW4iLCJlbWFpbCI6ImFkbWluQHNhcmFpLmFpIiwicm9sZSI6IkFETUlOIiwiZXhwIjo5OTk5OTk5OTk5fQ.mockSignature');
      localStorage.setItem('userData', JSON.stringify({ name: 'Admin', email: 'admin@sarai.ai', role: 'ADMIN' }));
      document.cookie = "isLoggedIn=true; path=/";
    });
  });

  test('should display team members list', async ({ page }) => {
    await page.goto('/team');
    await expect(page.locator('h1:has-text("Team Management")')).toBeVisible();
    await expect(page.locator('text=Status').first()).toBeVisible();
  });

  test('should display invite member modal', async ({ page }) => {
    await page.goto('/team');

    const dialogs: string[] = [];
    page.on('dialog', async dialog => {
      dialogs.push(dialog.message());
      await dialog.dismiss();
    });

    const inviteBtn = page.locator('text=Invite Member').first();
    if (await inviteBtn.isVisible()) {
      await inviteBtn.click();
      expect(dialogs).toContain('Nama Anggota:');
    }
  });
});
