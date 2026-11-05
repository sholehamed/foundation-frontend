import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../../shared/guards/can-deactivate.guard';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./tenant-list/tenant-list.component').then(x => x.TenantListComponent),
    data: { breadcrumb: 'مستاجرها' }
  },
  {
    path: 'create',canDeactivate:[unsavedChangesGuard],
    loadComponent: () =>
      import('./tenant-form/tenant-form.component').then(x => x.TenantFormComponent),
    data: { breadcrumb: 'مستاجر جدید' }
  },
  {
    path: ':tenantId/edit',canDeactivate:[unsavedChangesGuard],
    loadComponent: () =>
      import('./tenant-form/tenant-form.component').then(x => x.TenantFormComponent),
    data: { breadcrumb: 'ویرایش مستاجر' }
  },
  {
    path: ':tenantId',
    loadChildren: () => import('./tenant-detail/tenant-detail.routes'),
    data: { breadcrumb: 'جزئیات مستاجر' }
  }
] as Routes;
