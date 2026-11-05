import { Routes } from '@angular/router'
import { unsavedChangesGuard } from '../../../shared/guards/can-deactivate.guard'

// System user creation/update are intentionally unavailable pending a safe
// backend System-only identity contract. Existing handler currently forces
// an invalid Master TenantId and always resets the password on update.
export default [
  {
    path: '',
    loadComponent: () =>
      import('./admin-list/admin-list.component').then((x) => x.AdminListComponent),
    data: { breadcrumb: 'مدیران سیستم' },
  },
  {
    path: 'create',
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () =>
      import('./admin-form/admin-form.component').then((x) => x.AdminFormComponent),
    data: { breadcrumb: 'مدیر جدید' },
  },
  {
    path: ':userId/edit',
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () =>
      import('./admin-form/admin-form.component').then((x) => x.AdminFormComponent),
    data: { breadcrumb: 'ویرایش مدیر' },
  },
  { path: '**', redirectTo: '' },
] as Routes
