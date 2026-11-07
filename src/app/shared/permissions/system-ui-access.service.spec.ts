import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SystemUiAccessService } from './system-ui-access.service';

describe('SystemUiAccessService current-user permission checks', () => {
  let service: SystemUiAccessService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SystemUiAccessService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SystemUiAccessService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('asks only for code-owned UI key, never role/tenant/permission IDs', async () => {
    const p = firstValueFrom(service.canAccess('system.roles.permissions'));
    const req = http.expectOne(
      environment.apiUrl + '/system/UiAccess/me/system.roles.permissions');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys()).toEqual([]);
    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(req.request.headers.get('Cache-Control')).toBe('no-store');
    req.flush({ key: 'system.roles.permissions', allowed: true });
    expect(await p).toBe(true);
  });

  it('fails closed on false, mismatched keys, 401/403/500 and network errors', async () => {
    for (const [status, body] of [
      [200, { key: 'system.roles.permissions', allowed: false }],
      [200, { key: 'system.roles', allowed: true }],
      [200, {}],
      [401, {}], [403, {}], [500, {}],
    ] as const) {
      const p = firstValueFrom(service.canAccess('system.roles.permissions'));
      const req = http.expectOne(
        environment.apiUrl + '/system/UiAccess/me/system.roles.permissions');
      req.flush(body, { status, statusText: status === 200 ? 'OK' : 'Error' });
      expect(await p).toBe(false);
    }
    const p = firstValueFrom(service.canAccess('system.roles.permissions'));
    http.expectOne(environment.apiUrl + '/system/UiAccess/me/system.roles.permissions')
      .error(new ProgressEvent('error'));
    expect(await p).toBe(false);
  });

  it('rejects malformed keys before HTTP calls', async () => {
    expect(await firstValueFrom(service.canAccess('../admin?roleId=123'))).toBe(false);
    http.expectNone(req => req.url.includes('/UiAccess/'));
  });
});
