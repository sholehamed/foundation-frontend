import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import { tenantMemberAuditGuard } from './tenant-member-audit.guard';
import { TenantWorkspaceService } from '../../features/app/tenant-workspace.service';

describe('Tenant Owner member audit route guard', () => {
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
  const decide = () => TestBed.runInInjectionContext(() =>
    tenantMemberAuditGuard({} as never, {} as never));

  it('allows the route only for an explicit live Owner audit capability', async () => {
    getAdminCapabilities.mockReturnValue(of({
      canViewMembers: true, canViewMemberAudit: true,
    }));
    expect(await firstValueFrom(decide() as ReturnType<typeof of>)).toBe(true);
    getAdminCapabilities.mockReturnValue(of({
      canViewMembers: true, canViewMemberAudit: false,
    }));
    expect(await firstValueFrom(decide() as ReturnType<typeof of>))
      .toEqual({ deniedUrl: '/dashboard/members' });
    getAdminCapabilities.mockReturnValue(of({ canViewMembers: true }));
    expect(await firstValueFrom(decide() as ReturnType<typeof of>))
      .toEqual({ deniedUrl: '/dashboard/members' });
  });

  it('fails closed during a network outage', async () => {
    getAdminCapabilities.mockReturnValue(throwError(() => new Error('offline')));
    expect(await firstValueFrom(decide() as ReturnType<typeof of>))
      .toEqual({ deniedUrl: '/dashboard/members' });
  });
});
