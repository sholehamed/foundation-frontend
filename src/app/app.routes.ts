import { Routes } from '@angular/router';
import { SignInComponent } from './shared/pages/auth/sign-in/sign-in.component';
import { tenantSessionGuard } from './shared/guards/tenant-session.guard';
import { tenantOwnerDirectoryGuard } from './shared/guards/tenant-owner-directory.guard';
import { tenantMemberAuditGuard } from './shared/guards/tenant-member-audit.guard';
import { tenantGroupMembersGuard } from './shared/guards/tenant-group-members.guard';
import { tenantGroupRolesGuard } from './shared/guards/tenant-group-roles.guard';
import { tenantGroupAuditGuard } from './shared/guards/tenant-group-audit.guard';
import { tenantMemberEffectivePermissionsGuard } from './shared/guards/tenant-member-effective-permissions.guard';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/public/public.routes').then((x) => x.default),
  },
  {
    path: 'system',
    loadChildren: () => import('./features/system/system.routes').then((x) => x.default),
  },
  {
    path: 'dashboard',
    canActivate: [tenantSessionGuard],
    canActivateChild: [tenantSessionGuard],
    loadComponent: () => import('./features/app/tenant-workspace-layout.component')
      .then(x => x.TenantWorkspaceLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/app/tenant-dashboard.component')
          .then(x => x.TenantDashboardComponent),
      },
      {
        path: 'business',
        loadComponent: () => import('./features/app/tenant-business-profile.component')
          .then(x => x.TenantBusinessProfileComponent),
      },
      {
        path: 'branches',
        loadComponent: () => import('./features/app/tenant-branches.component')
          .then(x => x.TenantBranchesComponent),
      },
      {
        path: 'member-audit',
        data: { directoryKind: 'members' },
        canActivate: [tenantOwnerDirectoryGuard, tenantMemberAuditGuard],
        loadComponent: () => import('./features/app/tenant-member-audit.component')
          .then(x => x.TenantMemberAuditComponent),
      },
      {
        path: 'members/:id/effective-permissions',
        data: { directoryKind: 'members' },
        canActivate: [tenantOwnerDirectoryGuard, tenantMemberEffectivePermissionsGuard],
        loadComponent: () => import('./features/app/tenant-member-effective-permissions.component')
          .then(x => x.TenantMemberEffectivePermissionsComponent),
      },
      {
        path: 'members/:id/roles',
        data: { directoryKind: 'members' },
        canActivate: [tenantOwnerDirectoryGuard],
        loadComponent: () => import('./features/app/tenant-member-roles.component')
          .then(x => x.TenantMemberRolesComponent),
      },
      {
        path: 'groups/:id/audit',
        data: { directoryKind: 'groups' },
        canActivate: [tenantOwnerDirectoryGuard, tenantGroupAuditGuard],
        loadComponent: () => import('./features/app/tenant-group-audit.component')
          .then(x => x.TenantGroupAuditComponent),
      },
      {
        path: 'groups/:id/roles',
        data: { directoryKind: 'groups' },
        canActivate: [tenantOwnerDirectoryGuard, tenantGroupRolesGuard],
        loadComponent: () => import('./features/app/tenant-group-roles.component')
          .then(x => x.TenantGroupRolesComponent),
      },
      {
        path: 'groups/:id/members',
        data: { directoryKind: 'groups' },
        canActivate: [tenantOwnerDirectoryGuard, tenantGroupMembersGuard],
        loadComponent: () => import('./features/app/tenant-group-members.component')
          .then(x => x.TenantGroupMembersComponent),
      },
      {
        path: 'roles/:id/permissions',
        data: { directoryKind: 'roles' },
        canActivate: [tenantOwnerDirectoryGuard],
        loadComponent: () => import('./features/app/tenant-role-permissions.component')
          .then(x => x.TenantRolePermissionsComponent),
      },
      ...(['members', 'roles', 'groups'] as const).map(kind => ({
        path: kind,
        data: { directoryKind: kind },
        canActivate: [tenantOwnerDirectoryGuard],
        loadComponent: () => kind === 'roles'
          ? import('./features/app/tenant-roles.component').then(x => x.TenantRolesComponent)
          : kind === 'groups'
            ? import('./features/app/tenant-groups.component').then(x => x.TenantGroupsComponent)
            : import('./features/app/tenant-admin-directory.component')
                .then(x => x.TenantAdminDirectoryComponent),
      })),
    ],
  },
  {
    path: 'auth',
    children: [
      { path: 'login', component: SignInComponent, data: { login_context: 'tenant' } },
      {
        path: 'first-login',
        loadComponent: () => import('./features/public/tenant-first-login.component')
          .then(x => x.TenantFirstLoginComponent),
      },
      {
        path: 'activate',
        loadComponent: () => import('./features/public/tenant-invitation-activation.component')
          .then(x => x.TenantInvitationActivationComponent),
      },
      {
        path: 'access-denied',
        loadComponent: () => import('./shared/pages/tenant-access-denied.component')
          .then(x => x.TenantAccessDeniedComponent),
      },
    ],
  },
];
