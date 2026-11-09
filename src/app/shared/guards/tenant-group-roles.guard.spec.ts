import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import { tenantGroupRolesGuard } from './tenant-group-roles.guard';
import { TenantWorkspaceService } from '../../features/app/tenant-workspace.service';

describe('GroupRole PAGE guard', () => {
  const getUiAccess = vi.fn();
  beforeEach(() => {
    getUiAccess.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: TenantWorkspaceService, useValue: { getUiAccess } },
        { provide: Router, useValue: {
          parseUrl: (path: string) => ({ deniedUrl: path }),
        } },
      ],
    });
  });

  const decide = () => TestBed.runInInjectionContext(() =>
    tenantGroupRolesGuard({} as never, {} as never));
  const page = (key: string, route: string, allowed = true) =>
    ({ key, route, allowed, kind: 'PAGE' });

  it('requires fresh Groups and Roles PAGE grants, no wildcard bypass', async () => {
    const group = page('TENANT.GROUPS.READ', '/dashboard/groups');
    const role = page('TENANT.ROLES.READ', '/dashboard/roles');
    getUiAccess.mockReturnValue(of({ entries: [group, role] }));
    expect(await firstValueFrom(decide() as ReturnType<typeof of>)).toBe(true);
    getUiAccess.mockReturnValue(of({ entries: [group] }));
    expect(await firstValueFrom(decide() as ReturnType<typeof of>))
      .toEqual({ deniedUrl: '/dashboard/groups' });
    getUiAccess.mockReturnValue(of({ entries: [group, { ...role, allowed: false }] }));
    expect(await firstValueFrom(decide() as ReturnType<typeof of>))
      .toEqual({ deniedUrl: '/dashboard/groups' });
  });

  it('fails closed on malformed response or network errors', async () => {
    getUiAccess.mockReturnValue(of({ entries: null }));
    expect(await firstValueFrom(decide() as ReturnType<typeof of>))
      .toEqual({ deniedUrl: '/dashboard/groups' });
    getUiAccess.mockReturnValue(throwError(() => new Error('offline')));
    expect(await firstValueFrom(decide() as ReturnType<typeof of>))
      .toEqual({ deniedUrl: '/dashboard/groups' });
  });
});
