import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import { tenantGroupMembersGuard } from './tenant-group-members.guard';
import { TenantWorkspaceService } from '../../features/app/tenant-workspace.service';

describe('Group members PAGE guard', () => {
  const getUiAccess = vi.fn();
  beforeEach(() => {
    getUiAccess.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: TenantWorkspaceService, useValue: { getUiAccess } },
        { provide: Router, useValue: {
          parseUrl: (route: string) => ({ deniedUrl: route }),
        } },
      ],
    });
  });

  const decide = () => TestBed.runInInjectionContext(() =>
    tenantGroupMembersGuard({} as never, {} as never));

  const item = (key: string, route: string, allowed = true) =>
    ({ key, route, allowed, kind: 'PAGE' });

  it('requires *both* live Group and Member PAGE permissions', async () => {
    const groups = item('TENANT.GROUPS.READ', '/dashboard/groups');
    const members = item('TENANT.MEMBERS.READ', '/dashboard/members');
    getUiAccess.mockReturnValue(of({ entries: [groups, members] }));
    expect(await firstValueFrom(decide() as ReturnType<typeof of>)).toBe(true);

    getUiAccess.mockReturnValue(of({ entries: [groups] }));
    expect(await firstValueFrom(decide() as ReturnType<typeof of>))
      .toEqual({ deniedUrl: '/dashboard/groups' });
    getUiAccess.mockReturnValue(of({ entries: [groups, { ...members, allowed: false }] }));
    expect(await firstValueFrom(decide() as ReturnType<typeof of>))
      .toEqual({ deniedUrl: '/dashboard/groups' });
  });

  it('fails closed on missing data or network failure', async () => {
    getUiAccess.mockReturnValue(of({ entries: null }));
    expect(await firstValueFrom(decide() as ReturnType<typeof of>))
      .toEqual({ deniedUrl: '/dashboard/groups' });
    getUiAccess.mockReturnValue(throwError(() => new Error('offline')));
    expect(await firstValueFrom(decide() as ReturnType<typeof of>))
      .toEqual({ deniedUrl: '/dashboard/groups' });
  });
});
