import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import systemAdminRoutes from './admins.routes';
import { SystemAccountLifecycleService, SystemAccountLifecycleView } from './system-account-lifecycle.service';
import { legacySystemAccountCreateDenied, systemAccountLifecycleGuard } from './system-account-lifecycle.guard';
import { environment } from '../../../../environments/environment';
import { environment as prodEnvironment } from '../../../../environments/environment.prod';
import { environment as bffEnvironment } from '../../../../environments/environment.bff-pilot.e2e';

describe('FR-14B-3 System account lifecycle UI and CAS client', () => {
  let api: SystemAccountLifecycleService;
  let requests: HttpTestingController;
  const id = 'a72aac83-a9a1-4cec-83f7-8dbf818a2014';
  const url = environment.apiUrl + '/system/Admins/' + id;
  const view: SystemAccountLifecycleView = {
    id, userName: 'operator', firstName: 'Alice', lastName: 'Owner',
    email: 'alice@example.test', isActive: true,
    isLockedOut: false, version: 'version-123',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(SystemAccountLifecycleService);
    requests = TestBed.inject(HttpTestingController);
  });

  afterEach(() => requests.verify());

  it('never enables the System account editor on any build including Chromium pilot', () => {
    for (const config of [environment, prodEnvironment, bffEnvironment]) {
      expect(config.systemAccountLifecycleUiEnabled).toBe(false);
    }
    const create = systemAdminRoutes.find(r => r.path === 'create');
    const edit = systemAdminRoutes.find(r => r.path === ':userId/edit');
    expect(create?.canActivate).toContain(legacySystemAccountCreateDenied);
    expect(edit?.canActivate).toContain(systemAccountLifecycleGuard);
    expect(edit?.loadComponent).toBeDefined();
  });

  it('loads only the narrow System versioned lifecycle snapshot', () => {
    api.get(id).subscribe(data => expect(data).toEqual(view));
    const call = requests.expectOne(url + '/lifecycle');
    expect(call.request.method).toBe('GET');
    call.flush(view);
  });

  it('profile changes never include password, tenant, role or arbitrary user fields', () => {
    api.updateProfile(id, {
      firstName: 'A', lastName: 'B', email: 'new@example.test',
      expectedVersion: view.version,
    }).subscribe(data => expect(data.version).toBe(view.version));
    const call = requests.expectOne(url + '/profile');
    expect(call.request.method).toBe('PUT');
    expect(Object.keys(call.request.body).sort()).toEqual([
      'email', 'expectedVersion', 'firstName', 'lastName',
    ]);
    call.flush(view);
  });

  it('state and lock send desired value with exact version, never a blind toggle', () => {
    api.setState(id, false, view.version).subscribe();
    const state = requests.expectOne(url + '/state');
    expect(state.request.body).toEqual({
      isActive: false, expectedVersion: view.version,
    });
    state.flush(view);

    api.setLock(id, true, view.version).subscribe();
    const lock = requests.expectOne(url + '/lock');
    expect(lock.request.body).toEqual({
      isLockedOut: true, expectedVersion: view.version,
    });
    lock.flush(view);
  });
});
