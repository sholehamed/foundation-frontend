import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const api = 'http://127.0.0.1:5069/api/system';
const password = process.env.E2E_ADMIN_PASSWORD;
const captcha = 'ABCDE'; // Enabled only on disposable Development E2E fixture.

async function loginInBrowser(page: Page): Promise<string> {
  if (!password) throw new Error('E2E_ADMIN_PASSWORD is required.');
  await page.goto('/system/dashboard');
  await expect(page).toHaveURL(/\/system\/auth\/login/);
  await expect(page.locator('app-captcha img.captcha-image')).toBeVisible();
  await page.locator('input#username').fill('admin');
  await page.locator('input#password').fill(password);
  await page.locator('input#captcha-code').fill(captcha);
  await page.getByRole('button', { name: /ورود/ }).click();
  await expect(page).toHaveURL(/\/system\/dashboard/, { timeout: 20_000 });
  return await page.evaluate(() => localStorage.getItem('access_token') ?? '');
}

async function grant(request: APIRequestContext): Promise<string> {
  if (!password) throw new Error('E2E_ADMIN_PASSWORD is required.');
  const result = await request.get(api + '/Auth/captcha/new');
  expect(result.status()).toBe(200);
  const challenge = await result.json();
  const response = await request.post(api + '/Auth/login', {
    form: {
      grant_type: 'password', client_id: 'postman', username: 'admin',
      password, captchaid: challenge.token, userEnteredCaptchaCode: captcha,
      login_context: 'system', scope: 'openid profile email api offline_access'
    },
  });
  expect(response.status(), await response.text()).toBe(200);
  return (await response.json()).access_token as string;
}

test('System page guard refuses anonymous and tenant-context navigation', async ({ page }) => {
  await page.goto('/system/users');
  await expect(page).toHaveURL(/\/system\/auth\/login/);
  await page.evaluate(() => {
    localStorage.setItem('access_token', 'tenant-token-only');
    localStorage.setItem('account_type', 'tenant');
  });
  await page.goto('/system/roles');
  await expect(page).toHaveURL(/\/system\/auth\/login/);
});

test('real System browser login loads protected dashboard, role CRUD and tenant list', async ({ page, request }) => {
  const token = await loginInBrowser(page);
  expect(token).toBeTruthy();
  const headers = { Authorization: `Bearer ${token}` };

  // Verify dashboard is API-backed rather than a hard-coded Angular card.
  const dashboard = await request.get(api + '/Dashboard/super-dashboard', { headers });
  expect(dashboard.status(), await dashboard.text()).toBe(200);
  const stats = await dashboard.json();
  expect(stats.totalUsers).toBeGreaterThanOrEqual(1);

  const tenantResponse = page.waitForResponse(resp =>
    resp.url().includes('/api/system/Tenants/pagedList') && resp.request().method() === 'POST'
  );
  await page.goto('/system/tenants');
  const tenants = await tenantResponse;
  expect(tenants.status()).toBe(200);

  await page.goto('/system/roles/create');
  const name = 'CI-SYSTEM-ROLE-' + Date.now();
  await page.getByRole('textbox', { name: 'نام نقش' }).fill(name);
  const createdPromise = page.waitForResponse(resp =>
    /\/api\/system\/Roles\/?$/i.test(resp.url()) && resp.request().method() === 'POST'
  );
  await page.getByRole('button', { name: 'ذخیره' }).click();
  const created = await createdPromise;
  expect(created.status(), await created.text()).toBe(201);
  const roleId = await created.json() as string;
  expect(roleId).toMatch(/^[0-9a-f-]{36}$/i);

  try {
    await expect(page).toHaveURL(/\/system\/roles$/);
    await page.goto(`/system/roles/${roleId}/edit`);
    await expect(page.getByRole('textbox', { name: 'نام نقش' })).toHaveValue(name);

    const changed = name + '-EDITED';
    await page.getByRole('textbox', { name: 'نام نقش' }).fill(changed);
    const updatedPromise = page.waitForResponse(resp =>
      resp.url().includes(`/api/system/Roles/${roleId}`) && resp.request().method() === 'PUT'
    );
    await page.getByRole('button', { name: 'ذخیره' }).click();
    expect((await updatedPromise).status()).toBe(204);

    const stored = await request.get(`${api}/Roles/${roleId}`, { headers });
    expect(stored.status(), await stored.text()).toBe(200);
    expect((await stored.json()).name).toBe(changed);
  } finally {
    const deleted = await request.delete(`${api}/Roles/${roleId}`, { headers });
    expect([200, 204]).toContain(deleted.status());
  }
});

test('real System menu category API supports create, update and delete, not dummy UI routes', async ({ request }) => {
  const token = await grant(request);
  const headers = { Authorization: `Bearer ${token}` };
  const title = 'CI menu category ' + Date.now();
  const created = await request.post(api + '/MenuCategories', {
    headers, data: { title, order: 3, isActive: true }
  });
  expect(created.status(), await created.text()).toBe(200);
  const categoryId = await created.json() as string;
  expect(categoryId).toMatch(/^[0-9a-f-]{36}$/i);

  try {
    const update = await request.put(api + '/MenuCategories', {
      headers, data: { id: categoryId, title: title + ' updated', order: 2, isActive: true }
    });
    expect(update.status(), await update.text()).toBe(204);

    const fetched = await request.get(api + '/MenuCategories/' + categoryId, { headers });
    expect(fetched.status(), await fetched.text()).toBe(200);
    expect((await fetched.json()).title).toBe(title + ' updated');
  } finally {
    const removed = await request.delete(api + '/MenuCategories/' + categoryId, { headers });
    expect([200, 204]).toContain(removed.status());
  }
});


test('access-management menu links to real global Permission/API/UI resources; direct CRUD persists', async ({ page, request }) => {
  const token = await loginInBrowser(page);
  const headers = { Authorization: `Bearer ${token}` };
  const seenRequests: string[] = [];
  page.on('request', r => {
    if (r.url().toLowerCase().includes('/pagedlist')) seenRequests.push(r.url());
  });
  for (const slug of ['permissions', 'api-resources', 'ui-resources']) {
    await expect(page.locator(`app-sidebar a[href="/system/${slug}"]`)).toHaveCount(1);
    const endpoint = slug === 'permissions' ? 'permissions' : slug === 'api-resources'
      ? 'apiresources' : 'uiresources';
    const browserResponse = page.waitForResponse(r =>
      r.url().toLowerCase().includes(`/api/system/${endpoint}/pagedlist`) &&
      r.request().method() === 'POST', { timeout: 12_000 }
    );
    await page.goto('/system/' + slug);
    await expect(page.locator('app-grid')).toBeVisible();
    const response = await browserResponse.catch(error => {
      throw new Error(`No real ${slug} grid paging response. Captured: ${seenRequests.join('; ')}. ${String(error)}`);
    });
    expect(response.status(), await response.text()).toBe(200);
  }

  const unique = String(Date.now());
  const created: Array<{ endpoint: string; id: string }> = [];
  async function create(endpoint: string, data: Record<string, unknown>): Promise<string> {
    const response = await request.post(api + '/' + endpoint, { headers, data });
    expect(response.status(), `${endpoint}: ${await response.text()}`).toBe(201);
    const id = await response.json() as string;
    expect(id).toMatch(/^[0-9a-f-]{36}$/i);
    created.push({ endpoint, id });
    return id;
  }
  async function updateAndVerify(endpoint: string, id: string, data: Record<string, unknown>) {
    const updated = await request.put(`${api}/${endpoint}/${id}`, { headers, data });
    expect(updated.status(), `${endpoint}: ${await updated.text()}`).toBe(204);
    const read = await request.get(`${api}/${endpoint}/${id}`, { headers });
    expect(read.status(), await read.text()).toBe(200);
    return await read.json();
  }
  try {
    const moduleId = await create('Modules', {
      code: 'E2EMOD' + unique, title: 'Test access module', sortOrder: 90, isActive: true
    });
    const resourceId = await create('Resources', {
      moduleId, code: 'E2ERES' + unique, title: 'Test access resource',
      sortOrder: 91, isActive: true
    });
    const apiId = await create('ApiResources', {
      resourceId, key: 'E2EAPI' + unique, title: 'API test',
      routeTemplate: '/api/system/E2ETest', httpMethod: 4, source: 1,
      allowAnonymous: false, isActive: true, isDeprecated: false
    });
    const uiId = await create('UiResources', {
      resourceId, key: 'E2EUI' + unique, title: 'UI test',
      name: 'E2E UI', type: 0, isActive: true
    });
    const permissionId = await create('Permissions', {
      resourceId, code: 'E2EACCESS.' + unique, name: 'E2E access permission',
      description: 'Disposable integration fixture', isActive: true,
      permissionResources: [{ type: 'API', id: apiId }, { type: 'UI', id: uiId }]
    });
    const checkCases = [
      ['Permissions', 'code', 'E2EACCESS.' + unique],
      ['ApiResources', 'key', 'E2EAPI' + unique],
      ['UiResources', 'key', 'E2EUI' + unique],
    ] as const;
    for (const [endpoint, field, value] of checkCases) {
      const all = await request.post(`${api}/${endpoint}/pagedList`, {
        headers, data: { pageNumber: 1, pageSize: 100, filters: [] }
      });
      expect(all.status(), await all.text()).toBe(200);
      expect((await all.json()).data.some((item: Record<string, unknown>) => item[field] === value))
        .toBe(true);
      const scoped = await request.post(`${api}/${endpoint}/${resourceId}/pagedList`, {
        headers, data: { pageNumber: 1, pageSize: 100, filters: [] }
      });
      expect(scoped.status(), await scoped.text()).toBe(200);
      expect((await scoped.json()).data.some((item: Record<string, unknown>) => item[field] === value))
        .toBe(true);
    }

    const updatedApi = await updateAndVerify('ApiResources', apiId, {
      resourceId, key: 'E2EAPI' + unique, title: 'API edited',
      routeTemplate: '/api/system/E2ETest', httpMethod: 4, source: 1,
      allowAnonymous: false, isActive: true, isDeprecated: false
    });
    expect(updatedApi.title).toBe('API edited');
    const updatedUi = await updateAndVerify('UiResources', uiId, {
      resourceId, key: 'E2EUI' + unique, name: 'E2E UI', title: 'UI edited',
      type: 1, isActive: true
    });
    expect(updatedUi.title).toBe('UI edited');
    const updatedPermission = await updateAndVerify('Permissions', permissionId, {
      resourceId, code: 'E2EACCESS.' + unique, name: 'E2E permission edited',
      description: 'Update persisted', isActive: true,
      permissionResources: [{ type: 'API', id: apiId }, { type: 'UI', id: uiId }]
    });
    expect(updatedPermission.name).toBe('E2E permission edited');
    expect(updatedPermission.permissionResources).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'API', id: apiId }),
      expect.objectContaining({ type: 'UI', id: uiId })
    ]));
  } finally {
    // SQL Server intentionally forbids deleting Permission while it still has
    // API/UI link references. Remove links through the supported audited PUT
    // contract before deleting the permission and its resource fixtures.
    const permission = created.find(item => item.endpoint === 'Permissions');
    const resource = created.find(item => item.endpoint === 'Resources');
    if (permission && resource) {
      const unlink = await request.put(`${api}/Permissions/${permission.id}`, {
        headers, data: {
          resourceId: resource.id, code: 'E2EACCESS.' + unique,
          name: 'E2E permission edited', isActive: true, permissionResources: []
        }
      });
      expect(unlink.status(), await unlink.text()).toBe(204);
    }
    for (const { endpoint, id } of created.reverse()) {
      const deleted = await request.delete(`${api}/${endpoint}/${id}`, { headers });
      expect([200, 204], `${endpoint} ${id}: ${await deleted.text()}`)
        .toContain(deleted.status());
    }
  }
});
