import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { apiAuthInterceptor } from './api-auth.interceptor';
import { TokenStorageService } from '../services/token-storage.service';
import { environment } from '../../../environments/environment';

describe('System API credential interceptor', () => {
  beforeEach(() => {
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
    localStorage.clear();
  });
  it('sends bearer only to configured API and never to unrelated origin', () => {
    TestBed.inject(TokenStorageService).setTokens('secret-access', 'secret-refresh');
    const client = TestBed.inject(HttpClient);
    const http = TestBed.inject(HttpTestingController);

    client.get(environment.apiUrl + '/system/Roles/lookup').subscribe();
    const protectedRequest = http.expectOne(environment.apiUrl + '/system/Roles/lookup');
    expect(protectedRequest.request.headers.get('Authorization'))
      .toBe('Bearer secret-access');
    protectedRequest.flush([]);

    client.get('https://unrelated.example/assets').subscribe();
    const external = http.expectOne('https://unrelated.example/assets');
    expect(external.request.headers.has('Authorization')).toBe(false);
    external.flush({});
  });

  it('keeps OAuth login anonymous even when a stale token is stored', () => {
    TestBed.inject(TokenStorageService).setTokens('stale', 'stale');
    const client = TestBed.inject(HttpClient);
    const http = TestBed.inject(HttpTestingController);
    client.post(environment.apiUrl + '/system/Auth/login', {}).subscribe();
    const login = http.expectOne(environment.apiUrl + '/system/Auth/login');
    expect(login.request.headers.has('Authorization')).toBe(false);
    login.flush({});
  });

  it('clears stale System credentials on a protected 401, without retrying', () => {
    const storage = TestBed.inject(TokenStorageService);
    storage.setTokens('stale', 'refresh');
    storage.setUserInfo('Admin', '', '', '', 'system', 'admin', 'admin-id');
    const client = TestBed.inject(HttpClient);
    const http = TestBed.inject(HttpTestingController);
    client.get(environment.apiUrl + '/system/Dashboard/super-dashboard')
      .subscribe({ error: () => {} });
    http.expectOne(environment.apiUrl + '/system/Dashboard/super-dashboard')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(storage.getAccessToken()).toBeNull();
    expect(storage.getRefreshToken()).toBeNull();
  });
});
