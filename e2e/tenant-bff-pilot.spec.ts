import { expect, test, type Page } from '@playwright/test';

const host = 'tenant-a.shinera.localhost';
const session = {
  authenticated: true,
  user: { id: 'fixture-user', username: 'fixture', displayName: 'Fixture User' },
  context: {
    type: 'tenant', tenantId: 'fixture-tenant', tenantSlug: 'tenant-a',
  },
};
const uiAccess = {
  entries: [
    { key: 'TENANT.MEMBERS.READ', route: '/dashboard/members', kind: 'PAGE', allowed: true },
    { key: 'TENANT.ROLES.READ', route: '/dashboard/roles', kind: 'PAGE', allowed: true },
    { key: 'TENANT.GROUPS.READ', route: '/dashboard/groups', kind: 'PAGE', allowed: false },
  ],
};

async function mockTenantBranding(page: Page): Promise<void> {
  await page.route('**/api/system/tenants/resolve', async route => {
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        id: 'fixture-tenant', code: 'tenant-a', slug: 'tenant-a',
        domain: host, resolvedDomain: host, domains: [host],
        name: 'Tenant Browser Pilot', logo: null, favicon: null,
      }),
    });
  });
}

async function mockWorkspace(page: Page): Promise<void> {
  await page.route('**/api/tenant/workspace/ui-access/me', async route => {
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify(uiAccess),
    });
  });
  await page.route('**/api/tenant/workspace/members**', async route => {
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        items: [{
          id: 'fixture-user', userName: 'fixture',
          email: 'fixture@example.test', firstName: 'Fixture',
          lastName: 'Staff', isActive: true,
        }],
        page: 1, hasNext: false,
      }),
    });
  });
}

test('anonymous Tenant browser uses BFF navigation, never a Password Grant form', async ({ page }) => {
  await mockTenantBranding(page);
  await page.route('**/bff/session', async route => route.fulfill({
    status: 401, contentType: 'application/json', body: '{}',
  }));
  const legacyLogins: string[] = [];
  page.on('request', request => {
    if (request.url().includes('/system/Auth/login')) legacyLogins.push(request.url());
  });
  await page.goto('/dashboard/members');
  await expect(page).toHaveURL(/\/auth\/login/);
  await expect(page.getByRole('button', {
    name: /ورود امن از طریق سرویس هویت/,
  })).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);

  await page.route('**/bff/auth/login**', route => route.fulfill({
    status: 200, contentType: 'text/html',
    body: '<html><body><h1>BFF navigation fixture</h1></body></html>',
  }));
  await page.getByRole('button', {
    name: /ورود امن از طریق سرویس هویت/,
  }).click();
  await expect(page).toHaveURL(/\/bff\/auth\/login\?returnUrl=/);
  await expect(page.getByRole('heading', { name: 'BFF navigation fixture' })).toBeVisible();
  expect(legacyLogins).toEqual([]);
});

test('authenticated Tenant UI reads live BFF session and never sends a JS bearer', async ({ page }) => {
  await mockTenantBranding(page);
  await mockWorkspace(page);
  await page.addInitScript(() => {
    // Existing legacy credentials must not survive the opt-in browser pilot.
    localStorage.setItem('access_token', 'stale-test-only-access-token');
    localStorage.setItem('refresh_token', 'stale-test-only-refresh-token');
  });
  const tenantRequests: Array<{ url: string; authorization?: string }> = [];
  page.on('request', request => {
    if (request.url().includes('/api/tenant/workspace')) {
      tenantRequests.push({
        url: request.url(),
        authorization: request.headers()['authorization'],
      });
    }
  });
  await page.route('**/bff/session', async route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(session),
  }));
  await page.goto('/dashboard/members');
  await expect(page.getByRole('heading', { name: 'اعضای فضای کاری' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Fixture Staff' })).toBeVisible();
  expect(tenantRequests.length).toBeGreaterThanOrEqual(2);
  expect(tenantRequests.every(request => !request.authorization)).toBe(true);
  expect(await page.evaluate(() => [
    localStorage.getItem('access_token'), localStorage.getItem('refresh_token'),
  ])).toEqual([null, null]);
});

test('cross-context session refuses Tenant browser before reading privileged directory', async ({ page }) => {
  await mockTenantBranding(page);
  const privilegeReads: string[] = [];
  page.on('request', request => {
    if (request.url().includes('/api/tenant/workspace/members'))
      privilegeReads.push(request.url());
  });
  await page.route('**/bff/session', async route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({
      authenticated: true,
      user: session.user,
      context: { type: 'system', tenantId: null, tenantSlug: null },
    }),
  }));
  await page.goto('/dashboard/members');
  await expect(page).toHaveURL(/\/auth\/access-denied/);
  await expect(page.getByRole('heading', { name: 'دسترسی مجاز نیست' })).toBeVisible();
  expect(privilegeReads).toEqual([]);
});

test('Tenant logout UI sends real CSRF header and only navigates on confirmed 204', async ({ page }) => {
  await mockTenantBranding(page);
  await mockWorkspace(page);
  await page.route('**/bff/session', async route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(session),
  }));
  await page.route('**/api/tenant/workspace', async route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({
      tenant: { id: 'fixture-tenant', name: 'Tenant Browser Pilot', slug: 'tenant-a' },
      profile: null, mainBranch: null, branchesCount: 0,
      subscriptionStatus: 'pending_activation',
    }),
  }));
  await page.addInitScript(() => {
    document.cookie = 'XSRF-TOKEN=pilot%2Fxsrf; Path=/';
  });
  await page.route('**/bff/auth/csrf', async route => route.fulfill({ status: 204 }));
  let logoutValidated = false;
  await page.route('**/bff/auth/logout', async route => {
    expect(route.request().method()).toBe('POST');
    expect(route.request().headers()['x-xsrf-token']).toBe('pilot/xsrf');
    expect(route.request().headers()['authorization']).toBeUndefined();
    logoutValidated = true;
    await route.fulfill({ status: 204 });
  });
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'داشبورد فضای کاری' })).toBeVisible();
  await page.getByRole('button', { name: /خروج/ }).click();
  await expect(page).toHaveURL(/\/auth\/login/);
  expect(logoutValidated).toBe(true);
});

test('Tenant dashboard remains truthful and readable at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockTenantBranding(page);
  await mockWorkspace(page);
  await page.route('**/bff/session', async route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(session),
  }));
  await page.route('**/api/tenant/workspace/subscription/me', async route =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        status: 'NotSubscribed', reason: 'no_active_subscription',
        subscriptionId: null, planVersionId: null,
        startsAtUtc: null, endsAtUtc: null,
        hasCommercialEntitlement: false, moduleCodes: [], capabilities: [],
      }),
    }));
  await page.route('**/api/tenant/workspace', async route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({
      tenant: { id: 'fixture-tenant', name: 'Tenant Browser Pilot', slug: 'tenant-a' },
      profile: {
        displayName: 'کسب‌وکار آزمایشی مرورگر', activityType: 'Beauty',
        city: 'Tehran', address: '', requestedPlanKey: 'solo',
        requestedBillingCycle: 'monthly',
      },
      mainBranch: { id: 'main', name: 'شعبه اصلی', city: 'Tehran', address: '' },
      branchesCount: 2, subscriptionStatus: 'pending_activation',
    }),
  }));

  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'داشبورد فضای کاری' })).toBeVisible();
  const hero = page.locator('.tenant-command-hero');
  await expect(hero).toBeVisible();
  await expect(hero).toContainText('کسب‌وکار آزمایشی مرورگر');
  await expect(page.locator('.tenant-command-metric')).toHaveCount(4);
  await expect(page.locator('.tenant-command-status')).toContainText('اشتراک فعالی ثبت نشده');
  await expect(page.locator('app-tenant-usage-overview')).toHaveCount(0);
  await expect(page.locator('app-tenant-plan-allowances')).toHaveCount(0);
  await expect(page.locator('app-tenant-plan-orders')).toHaveCount(0);
  // Mobile layout should not push the page beyond the viewport. The header
  // navigation scrolls inside its own container instead of widening the page.
  const fits = await hero.evaluate(element =>
    element.getBoundingClientRect().width <= window.innerWidth + 1);
  expect(fits).toBe(true);
});
