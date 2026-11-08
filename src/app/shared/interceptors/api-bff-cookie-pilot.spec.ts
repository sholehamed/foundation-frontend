import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { apiAuthInterceptor } from './api-auth.interceptor';
import { TokenStorageService } from '../services/token-storage.service';

describe('FR-12G BFF Tenant API interceptor (pilot only)', () => {
  const previousFlag = environment.bffTenantPilotEnabled;
  const previousApi = environment.apiUrl;

  beforeEach(() => {
    environment.bffTenantPilotEnabled = true;
    environment.apiUrl = '/api';
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiAuthInterceptor])),
        provideHttpClientTesting(),
      ],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    environment.bffTenantPilotEnabled = previousFlag;
    environment.apiUrl = previousApi;
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; Path=/';
    localStorage.clear();
  });

  it('never attaches a stale bearer to Tenant workspace and uses same-origin cookie', () => {
    TestBed.inject(TokenStorageService).setTokens('stale-legacy-access', 'refresh');
    const client = TestBed.inject(HttpClient);
    client.get('/api/tenant/workspace/members').subscribe();
    const item = TestBed.inject(HttpTestingController)
      .expectOne('/api/tenant/workspace/members');
    expect(item.request.headers.has('Authorization')).toBe(false);
    expect(item.request.withCredentials).toBe(true);
    item.flush({ items: [] });
  });

  it('bootstraps same-origin antiforgery before sending unsafe grant change', () => {
    const client = TestBed.inject(HttpClient);
    client.put('/api/tenant/workspace/members/some-id/roles',
      { expectedVersion: 'version', roleIds: [] }).subscribe();
    const http = TestBed.inject(HttpTestingController);
    const csrf = http.expectOne('/bff/auth/csrf');
    expect(csrf.request.withCredentials).toBe(true);
    document.cookie = 'XSRF-TOKEN=csrf-grant-pilot; Path=/';
    csrf.flush(null);
    const put = http.expectOne('/api/tenant/workspace/members/some-id/roles');
    expect(put.request.headers.has('Authorization')).toBe(false);
    expect(put.request.withCredentials).toBe(true);
    expect(put.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-grant-pilot');
    put.flush({ version: 'new-version' });
  });

  it('refuses an external-origin workspace target instead of sending cookie or bearer', () => {
    const client = TestBed.inject(HttpClient);
    let rejected = false;
    client.get('https://evil.example/api/tenant/workspace/members')
      .subscribe({ error: () => rejected = true });
    expect(rejected).toBe(true);
    TestBed.inject(HttpTestingController).expectNone(req =>
      req.url.includes('evil.example'));
  });

  it('does not silently switch unrelated System APIs to BFF cookie mode', () => {
    TestBed.inject(TokenStorageService).setTokens('legacy-system-token', 'refresh');
    TestBed.inject(HttpClient).get('/api/system/Roles/lookup').subscribe();
    const request = TestBed.inject(HttpTestingController)
      .expectOne('/api/system/Roles/lookup');
    expect(request.request.headers.get('Authorization'))
      .toBe('Bearer legacy-system-token');
    expect(request.request.withCredentials).toBe(false);
    request.flush([]);
  });
});
