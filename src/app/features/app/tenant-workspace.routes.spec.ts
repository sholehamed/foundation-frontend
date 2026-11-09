import { routes } from '../../app.routes';
import { tenantSessionGuard } from '../../shared/guards/tenant-session.guard';
import { tenantOwnerDirectoryGuard } from '../../shared/guards/tenant-owner-directory.guard';
import { tenantMemberAuditGuard } from '../../shared/guards/tenant-member-audit.guard';
import { tenantGroupMembersGuard } from '../../shared/guards/tenant-group-members.guard';
import { tenantGroupRolesGuard } from '../../shared/guards/tenant-group-roles.guard';
import { tenantGroupAuditGuard } from '../../shared/guards/tenant-group-audit.guard';

describe('Tenant Admin read-only child navigation', () => {
  it('preserves /dashboard after login and protects every child with tenant session guard', () => {
    const route = routes.find(x => x.path === 'dashboard');
    expect(route).toBeDefined();
    expect(route?.canActivate).toContain(tenantSessionGuard);
    expect(route?.canActivateChild).toContain(tenantSessionGuard);

    const pages = route?.children ?? [];
    expect(pages.map(x => x.path)).toEqual(['', 'business', 'branches', 'member-audit', 'members/:id/roles', 'groups/:id/audit', 'groups/:id/roles', 'groups/:id/members', 'roles/:id/permissions', 'members', 'roles', 'groups']);
    expect(pages.filter(x => ['members', 'roles', 'groups', 'member-audit', 'members/:id/roles', 'groups/:id/audit', 'groups/:id/roles', 'groups/:id/members', 'roles/:id/permissions'].includes(x.path ?? ''))
      .every(x => x.canActivate?.includes(tenantOwnerDirectoryGuard))).toBe(true);
    expect(pages.find(x => x.path === 'groups/:id/audit')?.canActivate)
      .toContain(tenantGroupAuditGuard);
    expect(pages.find(x => x.path === 'groups/:id/roles')?.canActivate)
      .toContain(tenantGroupRolesGuard);
    expect(pages.find(x => x.path === 'groups/:id/members')?.canActivate)
      .toContain(tenantGroupMembersGuard);
    expect(pages.find(x => x.path === 'member-audit')?.canActivate)
      .toContain(tenantMemberAuditGuard);
    expect(pages.find(x => x.path === 'member-audit')?.data?.['directoryKind'])
      .toBe('members');
    expect(pages.every(x => !!x.loadComponent)).toBe(true);
    expect(pages.find(x => x.path === 'roles')?.data?.['directoryKind']).toBe('roles');
    expect(routes.find(x => x.path === 'system')).toBeDefined();
    expect(routes.some(x => x.path === 'auth')).toBe(true);
  });
});
