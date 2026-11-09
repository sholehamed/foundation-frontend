import { provideHttpClient, HttpParams } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { TenantContextService } from './tenant-context.service';
import { TokenStorageService } from './token-storage.service';

describe('AuthService logout', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TenantContextService, useValue: { current: null } },
      ],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    localStorage.clear();
  });

  it('revokes the current refresh token and clears local user state', () => {
    const storage = TestBed.inject(TokenStorageService);
    const http = TestBed.inject(HttpTestingController);
    const auth = TestBed.inject(AuthService);

    storage.setTokens('access-token', 'refresh-token');
    storage.setUserInfo('Admin', '', '', '', 'system', 'admin', 'subject');

    auth.logout();

    expect(storage.getAccessToken()).toBeNull();
    expect(storage.getRefreshToken()).toBeNull();
    expect(storage.getAccountType()).toBeNull();
    expect(storage.getUsername()).toBeNull();

    const request = http.expectOne(req => req.url.endsWith('/system/Auth/revoke'));
    expect(request.request.method).toBe('POST');
    const body = request.request.body as HttpParams;
    expect(body.get('token')).toBe('refresh-token');
    expect(body.get('token_type_hint')).toBe('refresh_token');
    request.flush({});
  });

  it('does not attempt revocation when no refresh token exists', () => {
    TestBed.inject(AuthService).logout();
    TestBed.inject(HttpTestingController).expectNone(req =>
      req.url.endsWith('/system/Auth/revoke')
    );
  });
});

describe('FR-13B-3C Identity interactive first-login contract', () => {
  let originalApiUrl: string;
  const challenge = 'A'.repeat(64);

  beforeEach(() => {
    originalApiUrl = environment.apiUrl;
    // The isolated Identity UI reverse-proxies /api on its own origin.
    environment.apiUrl = '/api';
    document.cookie = 'XSRF-TOKEN=unit-test-antiforgery';
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TenantContextService, useValue: { current: null } },
      ],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    environment.apiUrl = originalApiUrl;
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; Path=/';
  });

  function beginInteractiveSignIn(
    done: (value: unknown) => void,
  ) {
    const service = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);
    service.interactiveLogin(
      'member', 'initial-password', 'abcde', 'captcha-id',
      'tenant', 'tenant-a',
    ).subscribe(value => done(value));
    const csrf = http.expectOne('/api/system/Auth/csrf');
    expect(csrf.request.withCredentials).toBe(true);
    csrf.flush(null, { status: 204, statusText: 'No Content' });
    const login = http.expectOne('/api/system/Auth/interactive-login');
    expect(login.request.method).toBe('POST');
    expect(login.request.withCredentials).toBe(true);
    expect(login.request.headers.get('X-XSRF-TOKEN')).toBe('unit-test-antiforgery');
    expect(login.request.body).toEqual({
      username: 'member', password: 'initial-password',
      captchaId: 'captcha-id', captchaCode: 'abcde',
      loginContext: 'tenant', tenant: 'tenant-a',
    });
    return login;
  }

  it('204 Identity cookie sign-in permits normal OIDC continuation', () => {
    const outcomes: unknown[] = [];
    const login = beginInteractiveSignIn(value => outcomes.push(value));
    login.flush(null, { status: 204, statusText: 'No Content' });
    expect(outcomes).toEqual([{ status: 'authenticated' }]);
  });

  it('200 change-only challenge never resembles a normal authenticated session', () => {
    const outcomes: unknown[] = [];
    const login = beginInteractiveSignIn(value => outcomes.push(value));
    login.flush({
      status: 'password_change_required', challenge,
      expiresAtUtc: '2026-11-09T11:00:00Z',
    });
    expect(outcomes).toEqual([{
      status: 'password_change_required', challenge,
      expiresAtUtc: '2026-11-09T11:00:00Z',
    }]);
    expect(JSON.stringify(outcomes)).not.toContain('access_token');
    expect(JSON.stringify(outcomes)).not.toContain('refresh_token');
  });

  it('unexpected interactive response cannot be treated as a successful login', () => {
    const failures: unknown[] = [];
    const service = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);
    service.interactiveLogin('staff', 'password', '1', 'captcha',
      'tenant', 'tenant-a').subscribe({ error: err => failures.push(err) });
    http.expectOne('/api/system/Auth/csrf').flush(null, {
      status: 204, statusText: 'No Content',
    });
    http.expectOne('/api/system/Auth/interactive-login').flush({
      status: 'continue_login',
    });
    expect(failures).toHaveLength(1);
  });

  it('refuses password completion on an insecure origin', () => {
    const failures: unknown[] = [];
    const service = TestBed.inject(AuthService);
    service.completeInteractiveFirstLogin('tenant-a', challenge,
      'New-Long-Permanent-Password-2026!').subscribe({
      error: err => failures.push(err),
    });
    if (window.location.protocol !== 'https:') {
      expect(failures).toHaveLength(1);
      TestBed.inject(HttpTestingController).expectNone('/api/system/Auth/csrf');
    }
  });
});
