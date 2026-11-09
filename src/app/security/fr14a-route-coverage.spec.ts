import { routes } from '../app.routes';
import systemRoutes from '../features/system/system.routes';
import { systemFeatureRouteSegments } from '../features/system/feature-registry/system-feature.manifest';
import { systemSessionGuard } from '../shared/guards/system-session.guard';
import { systemAllUiAccessGuard } from '../shared/guards/system-all-ui-access.guard';
import { tenantSessionGuard } from '../shared/guards/tenant-session.guard';
import { tenantOwnerDirectoryGuard } from '../shared/guards/tenant-owner-directory.guard';
import { tenantMemberAuditGuard } from '../shared/guards/tenant-member-audit.guard';
import { tenantGroupAuditGuard } from '../shared/guards/tenant-group-audit.guard';
import { tenantMemberEffectivePermissionsGuard } from '../shared/guards/tenant-member-effective-permissions.guard';
import { tenantGroupRolesGuard } from '../shared/guards/tenant-group-roles.guard';
import { tenantGroupMembersGuard } from '../shared/guards/tenant-group-members.guard';
import { environment } from '../../environments/environment';
import { environment as prodEnvironment } from '../../environments/environment.prod';

/**
 * FR-14A audit invariant: newly added privileged UI routes cannot silently
 * evade the existing session + live PAGE guards. It is *not* backend auth.
 */
describe('FR-14A executable Angular route security coverage', () => {
  it('has one System-admin shell with live child guards across all 13 root feature routes', () => {
    const systemEntry = routes.find(r => r.path === 'system');
    expect(systemEntry?.loadChildren).toBeDefined();
    const shell = systemRoutes.find(r => r.path === '' && r.children);
    expect(shell).toBeDefined();
    expect(shell?.canActivate).toContain(systemSessionGuard);
    expect(shell?.canActivateChild).toContain(systemAllUiAccessGuard);

    const children = shell?.children ?? [];
    const expected = Object.values(systemFeatureRouteSegments);
    expect(expected).toHaveLength(13);
    expect(new Set(expected).size).toBe(expected.length);
    expect(expected.every(path =>
      children.some(child => child.path === path &&
        (child.loadChildren || child.loadComponent)))).toBe(true);
    expect(children.filter(child => child.loadChildren || child.loadComponent)
      .every(child => expected.includes(child.path as typeof expected[number]))).toBe(true);
    expect(systemRoutes.find(x => x.path === 'auth')?.canActivate)
      .toBeUndefined();
    expect(systemRoutes.find(x => x.path === 'access-denied')?.canActivate)
      .toBeUndefined();
  });

  it('binds every Tenant Admin route to home-Tenant session and a PAGE guard', () => {
    const workspace = routes.find(r => r.path === 'dashboard');
    expect(workspace).toBeDefined();
    expect(workspace?.canActivate).toContain(tenantSessionGuard);
    expect(workspace?.canActivateChild).toContain(tenantSessionGuard);
    const children = workspace?.children ?? [];
    expect(children.length).toBeGreaterThanOrEqual(13);
    const basic = new Set(['', 'business', 'branches']);
    const privileged = children.filter(x => !basic.has(x.path ?? ''));
    expect(privileged.length).toBeGreaterThanOrEqual(10);
    expect(privileged.every(x =>
      x.canActivate?.includes(tenantOwnerDirectoryGuard) &&
      ['members', 'groups', 'roles'].includes(String(x.data?.['directoryKind']))))
      .toBe(true);
    // Sensitive nested views additionally require an independent live Owner
    // or dual PAGE capability; a list PAGE alone cannot reveal grant history.
    const independent = new Map([
      ['member-audit', tenantMemberAuditGuard],
      ['members/:id/effective-permissions', tenantMemberEffectivePermissionsGuard],
      ['groups/:id/audit', tenantGroupAuditGuard],
      ['groups/:id/roles', tenantGroupRolesGuard],
      ['groups/:id/members', tenantGroupMembersGuard],
    ]);
    for (const [path, guard] of independent) {
      expect(children.find(x => x.path === path)?.canActivate)
        .toContain(guard);
    }
    expect(privileged.every(x => x.loadComponent != null)).toBe(true);
  });

  it('keeps privileged System and BFF authentication cutovers default-OFF in both builds', () => {
    for (const config of [environment, prodEnvironment]) {
      expect(config.systemUiAccessPilotEnabled).toBe(false);
      expect(config.bffTenantPilotEnabled).toBe(false);
      expect(config.tenantFirstLoginEnabled).toBe(false);
    }
  });
});
