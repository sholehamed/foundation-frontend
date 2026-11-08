import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, NavigationStart } from '@angular/router';
import { firstValueFrom, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CurrentUiAccessSnapshot, SystemUiAccessService,
  isAuthorizedUiSnapshot, isKeyAllowed, isRouteAllowed,
} from './system-ui-access.service';

const valid: CurrentUiAccessSnapshot = {
  schemaVersion: 2,
  entries: [
    { key: 'system.roles', route: '/system/roles', type: 'PAGE', allowed: true },
    { key: 'system.roles.create', route: '/system/roles/create', type: 'PAGE', allowed: false },
    { key: 'system.roles.action.assign-permissions', route: null, type: 'ACTION', allowed: true },
  ],
};

describe('SystemUiAccessService one snapshot per navigation', () => {
  let service: SystemUiAccessService;
  let http: HttpTestingController;
  let events: Subject<NavigationStart>;
  const url = environment.apiUrl + '/system/UiAccess/me';

  beforeEach(() => {
    events = new Subject<NavigationStart>();
    TestBed.configureTestingModule({
      providers: [
        SystemUiAccessService,
        provideHttpClient(), provideHttpClientTesting(),
        { provide: Router, useValue: { events: events.asObservable() } },
      ],
    });
    service = TestBed.inject(SystemUiAccessService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    events.complete();
  });

  it('shares the same request across root/child ACTION controls within one navigation', async () => {
    const a = firstValueFrom(service.canAccessRoute('/system/roles'));
    const b = firstValueFrom(service.canAccessRoute('/system/roles/create'));
    const c = firstValueFrom(service.canAccess('system.roles.action.assign-permissions'));
    const req = http.expectOne(url);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys()).toEqual([]);
    expect(req.request.headers.has('Cache-Control')).toBe(false);
    req.flush(valid);
    expect(await a).toBe(true);
    expect(await b).toBe(false);
    expect(await c).toBe(true);
  });

  it('re-queries on new navigation and on sensitive action click after revocation', async () => {
    const initial = firstValueFrom(service.canAccess('system.roles.action.assign-permissions'));
    http.expectOne(url).flush(valid);
    expect(await initial).toBe(true);

    const action = firstValueFrom(service.refreshAction('system.roles.action.assign-permissions'));
    http.expectOne(url).flush({ ...valid, entries: valid.entries.map(item =>
      item.type === 'ACTION' ? { ...item, allowed: false } : item) });
    expect(await action).toBe(false);

    events.next(new NavigationStart(2, '/system/roles'));
    const after = firstValueFrom(service.canAccessRoute('/system/roles'));
    http.expectOne(url).flush(valid);
    expect(await after).toBe(true);
  });

  it('fails closed on 401, network error, invalid payload and unknown keys', async () => {
    const unauthorized = firstValueFrom(service.canAccessRoute('/system/roles'));
    http.expectOne(url).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(await unauthorized).toBe(false);

    events.next(new NavigationStart(3, '/system/roles'));
    const broken = firstValueFrom(service.canAccess('system.roles'));
    http.expectOne(url).error(new ProgressEvent('error'));
    expect(await broken).toBe(false);

    events.next(new NavigationStart(4, '/system/roles'));
    const invalid = firstValueFrom(service.canAccess('system.roles'));
    http.expectOne(url).flush({ schemaVersion: 1, entries: valid.entries });
    expect(await invalid).toBe(false);
    expect(await firstValueFrom(service.canAccess('../unsafe?roleId=1'))).toBe(false);
    http.expectNone(url);
  });
});

describe('System UI snapshot validator', () => {
  it('accepts only stable unique keys, PAGE routes and ACTIONs without routes', () => {
    expect(isAuthorizedUiSnapshot(valid)).toBe(true);
    expect(isRouteAllowed(valid, '/system/roles')).toBe(true);
    expect(isRouteAllowed(valid, '/system/roles/create')).toBe(false);
    expect(isKeyAllowed(valid, 'system.roles.action.assign-permissions')).toBe(true);
    expect(isKeyAllowed(valid, 'unknown')).toBe(false);
    expect(isAuthorizedUiSnapshot({ ...valid, schemaVersion: 3 })).toBe(false);
    expect(isAuthorizedUiSnapshot({ ...valid, entries: [...valid.entries, valid.entries[0]] })).toBe(false);
    expect(isAuthorizedUiSnapshot({ ...valid, entries: [valid.entries[0],
      { ...valid.entries[1], route: '/system/roles' }] })).toBe(false);
    expect(isAuthorizedUiSnapshot({ ...valid, entries: [valid.entries[0],
      { ...valid.entries[2], route: '/system/roles/write' }] })).toBe(false);
  });
});
