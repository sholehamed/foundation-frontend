import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, isObservable, of } from 'rxjs';
import { systemAllUiAccessGuard, systemRouteTemplate } from './system-all-ui-access.guard';
import { SystemUiAccessService } from '../permissions/system-ui-access.service';
import { SYSTEM_UI_ACCESS_PILOT_ENABLED } from '../permissions/system-ui-access-pilot.token';
import systemRoutes from '../../features/system/system.routes';

@Component({ template: '' }) class FakePage {}

describe('Full System UI route guard', () => {
  const canAccessRoute = vi.fn(() => of(false));

  function configure(enabled: boolean) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: SYSTEM_UI_ACCESS_PILOT_ENABLED, useValue: enabled },
        { provide: SystemUiAccessService, useValue: { canAccessRoute } },
      ],
    });
  }
  function snapshot(parts: string[], container = false): ActivatedRouteSnapshot {
    const ancestors = parts.map((part, i) => ({
      routeConfig: { path: part, ...(i === parts.length - 1
        ? (container ? { loadChildren: () => Promise.resolve([]) } : { component: FakePage })
        : {}) },
    }));
    const leaf = ancestors.at(-1)!;
    return { ...leaf, pathFromRoot: ancestors } as unknown as ActivatedRouteSnapshot;
  }
  async function run(route: ActivatedRouteSnapshot) {
    const result = TestBed.runInInjectionContext(() =>
      systemAllUiAccessGuard(route, {} as RouterStateSnapshot));
    return isObservable(result) ? await firstValueFrom(result) : await result;
  }

  beforeEach(() => {
    canAccessRoute.mockReset();
    canAccessRoute.mockReturnValue(of(false));
  });

  it('is attached to the real System layout, not tenant/auth routes', () => {
    expect(systemRoutes.find(r => r.path === '')?.canActivateChild)
      .toContain(systemAllUiAccessGuard);
    expect(systemRoutes.find(r => r.path === 'access-denied')).toBeDefined();
  });

  it('uses Angular route templates, including nested resource params and tenant overview', async () => {
    configure(true);
    canAccessRoute.mockReturnValue(of(true));
    const leaf = snapshot(['system', '', 'resources', ':resourceId',
      'permissions', ':permissionId/edit']);
    expect(systemRouteTemplate(leaf))
      .toBe('/system/resources/:resourceId/permissions/:permissionId/edit');
    expect(await run(leaf)).toBe(true);
    expect(canAccessRoute).toHaveBeenCalledWith(
      '/system/resources/:resourceId/permissions/:permissionId/edit');

    const details = snapshot(['system', 'tenants', ':tenantId', '', 'overview']);
    expect(await run(details)).toBe(true);
    expect(canAccessRoute).toHaveBeenLastCalledWith(
      '/system/tenants/:tenantId/overview');
  });

  it('denies a revoked or unknown PAGE without falling back to a protected dashboard', async () => {
    configure(true);
    const denied = await run(snapshot(['system', 'admins', 'create']));
    expect(denied instanceof UrlTree).toBe(true);
    expect(TestBed.inject(Router).serializeUrl(denied as UrlTree))
      .toBe('/system/access-denied');
  });

  it('does not authorize layout containers; their executable children are checked', async () => {
    configure(true);
    expect(await run(snapshot(['system', 'tenants', ':tenantId'], true)))
      .toBe(true);
    expect(canAccessRoute).not.toHaveBeenCalled();
  });

  it('leaves existing URLs untouched when the explicit rollout is OFF', async () => {
    configure(false);
    expect(await run(snapshot(['system', 'users', 'create']))).toBe(true);
    expect(canAccessRoute).not.toHaveBeenCalled();
  });
});
