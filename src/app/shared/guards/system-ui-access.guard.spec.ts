import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, isObservable, of } from 'rxjs';
import { systemUiAccessGuard } from './system-ui-access.guard';
import { SystemUiAccessService } from '../permissions/system-ui-access.service';
import { SYSTEM_UI_ACCESS_PILOT_ENABLED } from '../permissions/system-ui-access-pilot.token';

describe('systemUiAccessGuard first explicit Roles permissions pilot', () => {
  const canAccess = vi.fn(() => of(false));

  const guard = async (key: unknown) => {
    const result = TestBed.runInInjectionContext(() =>
      systemUiAccessGuard(
        { data: { uiAccessKey: key } } as unknown as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      ));
    return isObservable(result) ? await firstValueFrom(result) : await result;
  };

  function configure(enabled: boolean) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: SYSTEM_UI_ACCESS_PILOT_ENABLED, useValue: enabled },
        { provide: SystemUiAccessService, useValue: { canAccess } },
      ],
    });
  }

  beforeEach(() => {
    canAccess.mockReset();
    canAccess.mockReturnValue(of(false));
  });

  it('preserves existing routes while rollout is explicitly OFF', async () => {
    configure(false);
    expect(await guard('system.roles.permissions')).toBe(true);
    expect(canAccess).not.toHaveBeenCalled();
  });

  it('allows on live true and denies revoked grant without stale cache', async () => {
    configure(true);
    canAccess.mockReturnValueOnce(of(true)).mockReturnValueOnce(of(false));
    expect(await guard('system.roles.permissions')).toBe(true);
    const denied = await guard('system.roles.permissions');
    expect(denied instanceof UrlTree).toBe(true);
    expect(TestBed.inject(Router).serializeUrl(denied as UrlTree))
      .toContain('/system/dashboard?accessDenied=1');
    expect(canAccess).toHaveBeenCalledTimes(2);
  });

  it('denies missing route key and malformed metadata before a request', async () => {
    configure(true);
    const denied = await guard(null);
    expect(denied instanceof UrlTree).toBe(true);
    expect(canAccess).not.toHaveBeenCalled();
  });
});
