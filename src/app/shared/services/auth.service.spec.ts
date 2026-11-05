import { provideHttpClient, HttpParams } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
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
