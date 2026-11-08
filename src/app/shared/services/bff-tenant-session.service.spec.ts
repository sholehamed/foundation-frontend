import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BffTenantSessionService, bffTenantLoginHref } from './bff-tenant-session.service';
import type { BffSessionResponse } from '../models/bff-session.contract';

const tenantSession: BffSessionResponse = {
  authenticated: true,
  user: { id: 'staff-id', username: 'staff', displayName: 'Staff' },
  context: { type: 'tenant', tenantId: 'tenant-id', tenantSlug: 'tenant-a' },
};

describe('FR-12G Tenant BFF client', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; Path=/';
  });

  it('uses only the cookie session endpoint and never asks for JS tokens', () => {
    const service = TestBed.inject(BffTenantSessionService);
    service.load().subscribe(session => expect(session).toEqual(tenantSession));
    const request = TestBed.inject(HttpTestingController).expectOne('/bff/session');
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush(tenantSession);
    expect(service.session()).toEqual(tenantSession);
  });

  it('clears stale view state on 401 or an incompatible System session', () => {
    const service = TestBed.inject(BffTenantSessionService);
    service.load().subscribe({ error: () => {} });
    TestBed.inject(HttpTestingController).expectOne('/bff/session')
      .flush(tenantSession);
    expect(service.session()).not.toBeNull();

    service.load().subscribe({ error: () => {} });
    TestBed.inject(HttpTestingController).expectOne('/bff/session')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(service.session()).toBeNull();

    service.load().subscribe({ error: () => {} });
    TestBed.inject(HttpTestingController).expectOne('/bff/session')
      .flush({ authenticated: true, context: { type: 'system' }, user: { id: 'admin' } });
    expect(service.session()).toBeNull();
  });

  it('fetches CSRF bootstrap and uses only the readable XSRF request token', () => {
    const service = TestBed.inject(BffTenantSessionService);
    let value = '';
    service.csrfToken().subscribe(token => value = token);
    const csrf = TestBed.inject(HttpTestingController).expectOne('/bff/auth/csrf');
    expect(csrf.request.method).toBe('GET');
    expect(csrf.request.withCredentials).toBe(true);
    document.cookie = 'XSRF-TOKEN=request%2Ftoken; Path=/';
    csrf.flush(null);
    expect(value).toBe('request/token');
  });

  it('requires CSRF on server ticket revocation and clears local state', () => {
    const service = TestBed.inject(BffTenantSessionService);
    service.load().subscribe();
    TestBed.inject(HttpTestingController).expectOne('/bff/session').flush(tenantSession);

    service.logout().subscribe();
    document.cookie = 'XSRF-TOKEN=csrf-test; Path=/';
    TestBed.inject(HttpTestingController).expectOne('/bff/auth/csrf').flush(null);
    const logout = TestBed.inject(HttpTestingController).expectOne('/bff/auth/logout');
    expect(logout.request.method).toBe('POST');
    expect(logout.request.withCredentials).toBe(true);
    expect(logout.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-test');
    expect(logout.request.headers.has('Authorization')).toBe(false);
    logout.flush(null);
    expect(service.session()).toBeNull();
  });

  it('accepts only local Tenant dashboard return paths for login', () => {
    expect(bffTenantLoginHref('/dashboard/roles'))
      .toBe('/bff/auth/login?returnUrl=%2Fdashboard%2Froles');
    for (const redirect of [
      'https://evil.example', '//evil.example', '/system/dashboard',
      '/auth/login', '/dashboard/../system', '/dashboard%2f..',
      '/dashboard\\evil', '/dashboard%252f',
    ]) {
      expect(bffTenantLoginHref(redirect))
        .toBe('/bff/auth/login?returnUrl=%2Fdashboard');
    }
  });
});
