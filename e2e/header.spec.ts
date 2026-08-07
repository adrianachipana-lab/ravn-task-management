import { test, expect } from '@playwright/test';

test.describe('Header interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.header', { timeout: 10000 });
  });

  test('opens the profile popover from the avatar button', async ({ page }) => {
    await page.getByLabel('Profile').click();

    const profilePopover = page.locator('.header__profile-popover');
    await expect(profilePopover).toBeVisible();
    await expect(profilePopover.locator('.header__profile-name')).toBeVisible();
    await expect(profilePopover.locator('.header__profile-email')).toContainText('@');
    await expect(profilePopover.locator('.header__profile-details')).toContainText('Type');
    await expect(profilePopover.locator('.header__profile-details')).toContainText('Created');
  });

  test('opens the notification center from the bell button', async ({ page }) => {
    await page.getByLabel('Notifications').click();

    const notificationsPopover = page.locator('.header__notifications-popover');
    await expect(notificationsPopover).toBeVisible();
    await expect(notificationsPopover).toContainText('Notifications');
    await expect(notificationsPopover).toContainText('No notifications yet');
  });
});
