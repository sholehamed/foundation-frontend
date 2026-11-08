import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import { tenantOwnerDirectoryGuard } from './tenant-owner-directory.guard';
import { TenantWorkspaceService } from '../../features/app/tenant-workspace.service';

describe('Tenant permission-backed directory route guard', () => {
  const getUiAccess = vi.fn();
  const entry = { key: 'TENANT.MEMBERS.READ', kind: 'PAGE' as const,
    route: '/dashboard/members', allowed: true };
  const route = { data: { directoryKind: 'members' } };
  beforeEach(() => {
    getUiAccess.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: TenantWorkspaceService, useValue: { getUiAccess } },
        { provide: Router, useValue: { parseUrl: (path: string) => ({ deniedUrl: path }) } },
      ],
    });
  });
  const decide = (data = route) => TestBed.runInInjectionContext(() =>
    tenantOwnerDirectoryGuard(data as never, {} as never));

  it('permits only an exact granted PAGE descriptor for the requested route', async () => {
    getUiAccess.mockReturnValue(of({ entries: [entry] }));
    expect(await firstValueFrom(decide() as ReturnType<typeof of>)).toBe(true);

    getUiAccess.mockReturnValue(of({ entries: [
      { ...entry, key: 'TENANT.ROLES.READ' },
    ] }));
    expect(await firstValueFrom(decide() as ReturnType<typeof of>)).toEqual({
      deniedUrl: '/dashboard',
    });
    getUiAccess.mockReturnValue(of({ entries: [
      { ...entry, kind: 'ACTION' },
    ] }));
    expect(await firstValueFrom(decide() as ReturnType<typeof of>)).toEqual({
      deniedUrl: '/dashboard',
    });
  });

  it('fails closed for explicit deny, network error and unknown route', async () => {
    getUiAccess.mockReturnValue(of({ entries: [{ ...entry, allowed: false }] }));
    expect(await firstValueFrom(decide() as ReturnType<typeof of>)).toEqual({
      deniedUrl: '/dashboard',
    });
    getUiAccess.mockReturnValue(throwError(() => new Error('offline')));
    expect(await firstValueFrom(decide() as ReturnType<typeof of>)).toEqual({
      deniedUrl: '/dashboard',
    });
    expect(decide({ data: { directoryKind: 'malicious' } }) as unknown).toEqual({
      deniedUrl: '/dashboard',
    });
  });
});
