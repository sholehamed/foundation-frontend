import { expect, test } from '@playwright/test';

const api = 'http://127.0.0.1:5069/api/system';
const password = process.env.E2E_ADMIN_PASSWORD;
const code = 'ABCDE';

async function authenticate(request: import('@playwright/test').APIRequestContext, username: string) {
  if (!password) throw new Error('E2E_ADMIN_PASSWORD is required');

  const challenge = await request.get(api + '/Auth/captcha/new');
  expect(challenge.status()).toBe(200);
  const { token } = await challenge.json();
  expect(token).toBeTruthy();

  const response = await request.post(api + '/Auth/login', {
    form: {
      grant_type: 'password',
      client_id: 'postman',
      username,
      password,
      captchaid: token,
      userEnteredCaptchaCode: code,
      login_context: 'system',
      scope: 'openid profile email api offline_access',
    },
  });
  expect(response.status(), await response.text()).toBe(200);
  const tokens = await response.json();
  expect(tokens.access_token).toEqual(expect.any(String));
  expect(tokens.refresh_token).toEqual(expect.any(String));
  return tokens as { access_token: string; refresh_token: string };
}

test('real System admin login grants protected access and allows refresh', async ({ request }) => {
  const tokens = await authenticate(request, 'admin');

  const who = await request.get(api + '/Auth/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  expect(who.status(), await who.text()).toBe(200);
  const info = await who.json();
  expect(info.account_type).toBe('system');
  expect(info.tenant_id).toBeFalsy();

  const roles = await request.get(api + '/Roles/lookup', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  expect(roles.status(), await roles.text()).toBe(200);

  const refreshed = await request.post(api + '/Auth/login', {
    form: {
      grant_type: 'refresh_token',
      client_id: 'postman',
      refresh_token: tokens.refresh_token,
    },
  });
  expect(refreshed.status(), await refreshed.text()).toBe(200);
  expect((await refreshed.json()).access_token).toEqual(expect.any(String));
});

test('real non-admin System account receives 403, not 401', async ({ request }) => {
  const viewer = await authenticate(request, 'e2e-viewer');
  const response = await request.get(api + '/Roles/lookup', {
    headers: { Authorization: `Bearer ${viewer.access_token}` },
  });
  expect(response.status(), await response.text()).toBe(403);
});

test('standard OAuth revocation invalidates a refresh token', async ({ request }) => {
  const tokens = await authenticate(request, 'admin');
  const revoke = await request.post(api + '/Auth/revoke', {
    form: {
      client_id: 'postman',
      token: tokens.refresh_token,
      token_type_hint: 'refresh_token',
    },
  });
  expect(revoke.status(), await revoke.text()).toBe(200);

  const after = await request.post(api + '/Auth/login', {
    form: {
      grant_type: 'refresh_token',
      client_id: 'postman',
      refresh_token: tokens.refresh_token,
    },
  });
  expect(after.status()).toBe(400);
  expect((await after.json()).access_token).toBeUndefined();
});

test('browser signs in as System admin and navigates to dashboard', async ({ page }) => {
  if (!password) throw new Error('E2E_ADMIN_PASSWORD is required');
  await page.goto('/system/auth/login');
  await expect(page.locator('app-captcha img.captcha-image')).toBeVisible();
  await page.locator('input#username').fill('admin');
  await page.locator('input#password').fill(password);
  await page.locator('input#captcha-code').fill(code);
  await page.getByRole('button', { name: /ورود/ }).click();
  await expect(page).toHaveURL(/\/system\/dashboard/, { timeout: 15_000 });
  expect(await page.evaluate(() => localStorage.getItem('access_token'))).toBeTruthy();
});
