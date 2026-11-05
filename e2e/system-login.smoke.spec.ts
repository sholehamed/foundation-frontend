import { expect, test } from '@playwright/test';

// Real browser + Angular app + real ASP.NET Core API + disposable SQL Server.
// These tests use only public/anonymous endpoints and never rely on shared credentials.
test('system login renders and loads a real captcha from the backend', async ({ page }) => {
  await page.goto('/system/auth/login');
  await expect(page.getByRole('heading', { name: 'ورود به حساب کاربری' })).toBeVisible();
  await expect(page.locator('app-captcha img.captcha-image')).toBeVisible();
});

test('system login requires credentials before submitting', async ({ page }) => {
  await page.goto('/system/auth/login');
  await page.getByRole('button', { name: /ورود/ }).click();
  await expect(page).toHaveURL(/\/system\/auth\/login/);
});

test('public homepage is available', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('app-fp-banner')).toBeVisible();
});
