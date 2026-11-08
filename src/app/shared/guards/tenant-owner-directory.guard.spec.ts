import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import { tenantOwnerDirectoryGuard } from './tenant-owner-directory.guard';
import { TenantWorkspaceService } from '../../features/app/tenant-workspace.service';

describe('Tenant owner administration guard', () => {
  const getAdminCapabilities = vi.fn();
  beforeEach(() => {
    getAdminCapabilities.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: TenantWorkspaceService, useValue: { getAdminCapabilities } },
        { provide: Router, useValue: { parseUrl: (path: string) => ({ deniedUrl: path }) } },
      ],
    });
  });
  it('allows live owner only', async () => {
    getAdminCapabilities.mockReturnValue(of({ canViewAdministration: true }));
    const decision = TestBed.runInInjectionContext(() => tenantOwnerDirectoryGuard({} as never, {} as never));
    expect(await firstValueFrom(decision as ReturnType<typeof of>)).toBe(true);
  });
  it('fails closed on denied capability or HTTP failure', async () => {
    getAdminCapabilities.mockReturnValue(of({ canViewAdministration: false }));
    const denied = TestBed.runInInjectionContext(() => tenantOwnerDirectoryGuard({} as never, {} as never));
    expect(await firstValueFrom(denied as ReturnType<typeof of>)).toEqual({ deniedUrl: '/dashboard' });
    getAdminCapabilities.mockReturnValue(throwError(() => new Error('offline')));
    const failed = TestBed.runInInjectionContext(() => tenantOwnerDirectoryGuard({} as never, {} as never));
    expect(await firstValueFrom(failed as ReturnType<typeof of>)).toEqual({ deniedUrl: '/dashboard' });
  });
});
