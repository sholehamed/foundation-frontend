import { routes } from '../../app.routes';
import { tenantSessionGuard } from '../../shared/guards/tenant-session.guard';
import { tenantOwnerDirectoryGuard } from '../../shared/guards/tenant-owner-directory.guard';

describe('Tenant Admin read-only child navigation', () => {
  it('preserves /dashboard after login and protects every child with tenant session guard', () => {
    const route = routes.find(x => x.path === 'dashboard');
    expect(route).toBeDefined();
    expect(route?.canActivate).toContain(tenantSessionGuard);
    expect(route?.canActivateChild).toContain(tenantSessionGuard);

    const pages = route?.children ?? [];
    expect(pages.map(x => x.path)).toEqual(['', 'business', 'branches', 'members/:id/roles', 'roles/:id/permissions', 'members', 'roles', 'groups']);
    expect(pages.filter(x => ['members', 'roles', 'groups', 'members/:id/roles', 'roles/:id/permissions'].includes(x.path ?? ''))
      .every(x => x.canActivate?.includes(tenantOwnerDirectoryGuard))).toBe(true);
    expect(pages.every(x => !!x.loadComponent)).toBe(true);
    expect(pages.find(x => x.path === 'roles')?.data?.['directoryKind']).toBe('roles');
    expect(routes.find(x => x.path === 'system')).toBeDefined();
    expect(routes.some(x => x.path === 'auth')).toBe(true);
  });
});
