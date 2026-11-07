import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../../shared/guards/can-deactivate.guard';
import { systemUiAccessGuard } from '../../../shared/guards/system-ui-access.guard';
import { rolePermissionUiKeys } from '../../../shared/permissions/role-permission-ui.keys';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./role-list/role-list.component').then(x => x.RoleListComponent),
    data: { breadcrumb: 'نقش ها' }
  },
  {
    path: 'create',canDeactivate:[unsavedChangesGuard],
    loadComponent: () =>
      import('./role-form/role-form.component').then(x => x.RoleFormComponent),
    data: { breadcrumb: ' نقش جدید' }
  },
  {
    path: ':roleId/edit',canDeactivate:[unsavedChangesGuard],
    loadComponent: () =>
      import('./role-form/role-form.component').then(x => x.RoleFormComponent),
    data: { breadcrumb: 'ویرایش  نقش' }
  },
  {
    path: ':roleId/permissions',
    canActivate: [systemUiAccessGuard],
    data: {
      breadcrumb: 'مجوزهای نقش',
      uiAccessKey: rolePermissionUiKeys.page,
    },
    loadComponent: () =>
      import('./role-permissions-page/role-permissions-page.component').then(x => x.RolePermissionsPageComponent),
  },
 
] as Routes;
