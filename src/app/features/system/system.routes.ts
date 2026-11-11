import { Routes } from '@angular/router'
import { PanelLayoutComponent } from '../../shared/layouts/dashboard-layout/panel-layout.component'
import { SignInComponent } from '../../shared/pages/auth/sign-in/sign-in.component'
import { systemSessionGuard } from '../../shared/guards/system-session.guard'
import { systemAllUiAccessGuard } from '../../shared/guards/system-all-ui-access.guard'
import { systemFeatureRouteSegments } from './feature-registry/system-feature.manifest'

export default [
  {
    path: '',
    component: PanelLayoutComponent,
    canActivate: [systemSessionGuard],
    canActivateChild: [systemAllUiAccessGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: systemFeatureRouteSegments.admins,
        loadChildren: () => import('./admin/admins.routes'),
        data: { breadcrumb: 'مدیریت مدیران' },
      },
      {
        path: systemFeatureRouteSegments.users,
        loadChildren: () => import('./user/users.routes'),
        data: { breadcrumb: 'مدیریت کاربران' },
      },
      {
        path: systemFeatureRouteSegments.roles,
        loadChildren: () => import('./role/roles.routes'),
        data: { breadcrumb: 'مدیریت نقش‌ها' },
      },
      {
        path: systemFeatureRouteSegments.groups,
        loadChildren: () => import('./group/groups.routes'),
        data: { breadcrumb: 'گروه‌های کاربری' },
      },
      {
        path: systemFeatureRouteSegments.dashboard,
        loadComponent: () =>
          import('./system-dashboard/system-dashboard.component').then(
            (x) => x.SystemDashboardComponent
          ),
      },
      {
        path: systemFeatureRouteSegments.tenants,
        loadChildren: () => import('./tenants/tenants.routes'),
        data: { breadcrumb: 'مدیریت مستاجرها' },
      },
      {
        path: systemFeatureRouteSegments.modules,
        loadChildren: () => import('./modules/modules.routes'),
        data: { breadcrumb: 'مدیریت ماژول ها' },
      },
      {
        path: systemFeatureRouteSegments.permissions,
        loadChildren: () => import('./resources/permissions/permissions.routes'),
        data: { breadcrumb: 'مدیریت مجوز ها' },
      },
      {
        path: systemFeatureRouteSegments.apiResources,
        loadChildren: () => import('./resources/api-resources/api-resources.routes'),
        data: { breadcrumb: 'مدیریت منابع سرویس ها' },
      },
      {
        path: systemFeatureRouteSegments.uiResources,
        loadChildren: () => import('./resources/ui-resources/ui-resources.routes'),
        data: { breadcrumb: 'مدیریت منابع صفحات ها' },
      },
      {
        path: systemFeatureRouteSegments.resources,
        loadChildren: () => import('./resources/resources.routes'),
        data: { breadcrumb: 'مدیریت منابع' },
      },
      {
        path: systemFeatureRouteSegments.featureRegistry,
        loadComponent: () =>
          import('./feature-registry/feature-registry.component').then(
            x => x.FeatureRegistryPageComponent
          ),
        data: { breadcrumb: 'رجیستری قابلیت‌ها' },
      },
      {
        path: systemFeatureRouteSegments.controlTower,
        loadComponent: () => import('./control-tower/control-tower-page.component')
          .then(x => x.ControlTowerPageComponent),
        data: { breadcrumb: 'مرکز پایش' },
      },
      {
        path: systemFeatureRouteSegments.planCatalog,
        loadComponent: () =>
          import('./plan-catalog/system-plan-catalog.component').then(
            x => x.SystemPlanCatalogComponent
          ),
        data: { breadcrumb: 'مدیریت پلن‌ها' },
      },
      {
        path: systemFeatureRouteSegments.menuManagement,
        loadComponent: () =>
          import('./menu-management/menu-management.component').then(
            (x) => x.MenuManagementPage
          ),
        data: { breadcrumb: 'مدیریت منو' },
      },
    ],
  },
  {
    path: 'access-denied',
    loadComponent: () => import('../../shared/pages/system-access-denied.component')
      .then(x => x.SystemAccessDeniedComponent),
  },
  {
    path: 'auth',
    children: [
      { path: 'login', component: SignInComponent, data: { login_context: 'system' } },
    ],
  },
] as Routes
