import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import { tenantGroupAuditGuard } from './tenant-group-audit.guard';
import { TenantWorkspaceService } from '../../features/app/tenant-workspace.service';

describe('Group security history Owner guard', () => {
  const getAdminCapabilities = vi.fn();
  beforeEach(() => {
    getAdminCapabilities.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: TenantWorkspaceService, useValue: { getAdminCapabilities } },
        { provide: Router, useValue: {
          parseUrl: (url: string) => ({ deniedUrl: url }),
        } },
      ],
    });
  });

  const decide = () => TestBed.runInInjectionContext(
    () => tenantGroupAuditGuard({} as never, {} as never));

  it('accepts only explicit live server Owner audit capability', async () => {
    getAdminCapabilities.mockReturnValue(of({ canViewGroupAudit: true }));
    expect(await firstValueFrom(decide() as ReturnType<typeof of>)).toBe(true);
    for (const value of [false, undefined, null]) {
      getAdminCapabilities.mockReturnValue(of({ canViewGroupAudit: value }));
      expect(await firstValueFrom(decide() as ReturnType<typeof of>))
        .toEqual({ deniedUrl: '/dashboard/groups' });
    }
  });

  it('fails closed when the server is unavailable', async () => {
    getAdminCapabilities.mockReturnValue(throwError(() => new Error('offline')));
    expect(await firstValueFrom(decide() as ReturnType<typeof of>))
      .toEqual({ deniedUrl: '/dashboard/groups' });
  });
});
