import { expect, test } from '@playwright/test';

const apiBaseUrl = 'http://127.0.0.1:5069/api';

test('anonymous captcha endpoint returns a real challenge', async ({ request }) => {
  const response = await request.get(apiBaseUrl + '/system/Auth/captcha/new');
  expect(response.ok()).toBeTruthy();

  const data = await response.json();
  expect(data.token).toEqual(expect.any(String));
  expect(data.token.length).toBeGreaterThan(10);
  expect(data.imageUrl).toContain('captcha/image');
});

test('protected role lookup requires an authenticated user', async ({ request }) => {
  const response = await request.get(apiBaseUrl + '/system/Roles/lookup');
  expect([401, 403]).toContain(response.status());
});
