import { expect, test } from '@playwright/test';

const api = 'http://127.0.0.1:5069/api/system';

test('anonymous callers cannot access any of the 12 privileged System groups', async ({ request }) => {
  for (const path of [
    '/Dashboard/super-dashboard',
    '/Tenants/00000000-0000-0000-0000-000000000001',
    '/Users/00000000-0000-0000-0000-000000000001',
    '/Roles/lookup',
    '/ApiResources/lookup',
    '/UiResources/lookup',
    '/Groups/lookup',
    '/MenuCategories/list',
    '/Menus/getUserMenus?roleId=00000000-0000-0000-0000-000000000001',
    '/Modules/lookup',
    '/Permissions/lookup',
    '/Resources/lookup',
  ]) {
    const response = await request.get(api + path);
    expect(response.status(), path).toBe(401);
  }
});

test('anonymous callers cannot mutate tenants', async ({ request }) => {
  const response = await request.post(api + '/Tenants', {
    data: { name: 'Unauthenticated request' },
  });
  expect(response.status()).toBe(401);
});

test('malformed CAPTCHA is refused by the token endpoint', async ({ request }) => {
  const response = await request.post(api + '/Auth/login', {
    form: {
      grant_type: 'password',
      client_id: 'postman',
      username: 'not-a-real-user',
      password: 'invalid-password',
      login_context: 'system',
      captchaid: 'invalid-token',
      userEnteredCaptchaCode: 'ABCDE',
      scope: 'api',
    },
  });
  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(body.error).toBe('invalid_grant');
});

test('missing login context fails without an internal error', async ({ request }) => {
  const response = await request.post(api + '/Auth/login', {
    form: {
      grant_type: 'password',
      client_id: 'postman',
      username: 'not-a-real-user',
      password: 'invalid-password',
      captchaid: 'invalid-token',
      userEnteredCaptchaCode: 'ABCDE',
    },
  });
  expect(response.status()).toBe(400);
});
