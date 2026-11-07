import { Routes } from '@angular/router'
import { PanelLayoutComponent } from '../../shared/layouts/dashboard-layout/panel-layout.component'
import { SignInComponent } from '../../shared/pages/auth/sign-in/sign-in.component'
import { systemSessionGuard } from '../../shared/guards/system-session.guard'
import { systemFeatureManifest } from './feature-registry/system-feature.manifest'

export default [
  {
    path: '',
    component: PanelLayoutComponent,
    canActivate: [systemSessionGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'admins',
        loadChildren: () => import('./admin/admins.routes'),
        data: { breadcrumb: 'مدیریت مدیران' },
      },
      {
        path: 'users',
        loadChildren: () => import('./user/users.routes'),
        data: { breadcrumb: 'مدیریت کاربران' },
      },
      {
        path: systemFeatureManifest.roles.segment,
        loadChildren: () => import('./role/roles.routes'),
        data: {
          breadcrumb: 'مدیریت نقش‌ها',
          featureKey: systemFeatureManifest.roles.key,
          permissionCode: systemFeatureManifest.roles.permissionCode,
        },
      },
      {
        path: 'groups',
        loadChildren: () => import('./group/groups.routes'),
        data: { breadcrumb: 'گروه‌های کاربری' },
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./system-dashboard/system-dashboard.component').then(
            (x) => x.SystemDashboardComponent
          ),
      },
      {
        path: 'tenants',
        loadChildren: () => import('./tenants/tenants.routes'),
        data: { breadcrumb: 'مدیریت مستاجرها' },
      },
      {
        path: 'modules',
        loadChildren: () => import('./modules/modules.routes'),
        data: { breadcrumb: 'مدیریت ماژول ها' },
      },
      {
        path: systemFeatureManifest.permissions.segment,
        loadChildren: () => import('./resources/permissions/permissions.routes'),
        data: {
          breadcrumb: 'مدیریت مجوز ها',
          featureKey: systemFeatureManifest.permissions.key,
          permissionCode: systemFeatureManifest.permissions.permissionCode,
        },
      },
      {
        path: 'api-resources',
        loadChildren: () => import('./resources/api-resources/api-resources.routes'),
        data: { breadcrumb: 'مدیریت منابع سرویس ها' },
      },
      {
        path: 'ui-resources',
        loadChildren: () => import('./resources/ui-resources/ui-resources.routes'),
        data: { breadcrumb: 'مدیریت منابع صفحات ها' },
      },
      {
        path: 'resources',
        loadChildren: () => import('./resources/resources.routes'),
        data: { breadcrumb: 'مدیریت منابع' },
      },
      {
        path: 'feature-registry',
        loadComponent: () =>
          import('./feature-registry/feature-registry.component').then(
            x => x.FeatureRegistryPageComponent
          ),
        data: { breadcrumb: 'رجیستری قابلیت‌ها' },
      },
      {
        path: 'menu-management',
        loadComponent: () =>
          import('./menu-management/menu-management.component').then(
            (x) => x.MenuManagementPage
          ),
        data: { breadcrumb: 'مدیریت منو' },
      },
    ],
  },
  {
    path: 'auth',
    children: [
      { path: 'login', component: SignInComponent, data: { login_context: 'system' } },
    ],
  },
] as Routes
