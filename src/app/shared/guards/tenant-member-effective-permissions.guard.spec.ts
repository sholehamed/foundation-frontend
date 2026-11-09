import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import { tenantMemberEffectivePermissionsGuard } from './tenant-member-effective-permissions.guard';
import { TenantWorkspaceService } from '../../features/app/tenant-workspace.service';

describe('Member effective permissions Owner route gate', () => {
  const getAdminCapabilities = vi.fn();
  beforeEach(() => {
    getAdminCapabilities.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: TenantWorkspaceService, useValue: { getAdminCapabilities } },
        { provide: Router, useValue: {
          parseUrl: (path: string) => ({ deniedUrl: path }),
        } },
      ],
    });
  });

  const evaluate = () => TestBed.runInInjectionContext(() =>
    tenantMemberEffectivePermissionsGuard({} as never, {} as never));

  it('allows only explicit fresh server capability', async () => {
    getAdminCapabilities.mockReturnValueOnce(of({
      canViewMemberEffectivePermissions: true,
    }));
    expect(await firstValueFrom(evaluate() as ReturnType<typeof of>)).toBe(true);

    getAdminCapabilities.mockReturnValueOnce(of({
      canViewMembers: true, canViewMemberEffectivePermissions: false,
    }));
    expect(await firstValueFrom(evaluate() as ReturnType<typeof of>))
      .toEqual({ deniedUrl: '/dashboard/members' });
  });

  it('fails closed on missing data or request failure', async () => {
    getAdminCapabilities.mockReturnValueOnce(of(null));
    expect(await firstValueFrom(evaluate() as ReturnType<typeof of>))
      .toEqual({ deniedUrl: '/dashboard/members' });
    getAdminCapabilities.mockReturnValueOnce(throwError(() => new Error('offline')));
    expect(await firstValueFrom(evaluate() as ReturnType<typeof of>))
      .toEqual({ deniedUrl: '/dashboard/members' });
  });
});
