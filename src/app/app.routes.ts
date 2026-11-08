import { Routes } from '@angular/router';
import { SignInComponent } from './shared/pages/auth/sign-in/sign-in.component';
import { tenantSessionGuard } from './shared/guards/tenant-session.guard';
import { tenantOwnerDirectoryGuard } from './shared/guards/tenant-owner-directory.guard';

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
        path: 'members/:id/roles',
        data: { directoryKind: 'members' },
        canActivate: [tenantOwnerDirectoryGuard],
        loadComponent: () => import('./features/app/tenant-member-roles.component')
          .then(x => x.TenantMemberRolesComponent),
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
        path: 'access-denied',
        loadComponent: () => import('./shared/pages/tenant-access-denied.component')
          .then(x => x.TenantAccessDeniedComponent),
      },
    ],
  },
];
