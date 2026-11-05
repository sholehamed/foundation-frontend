import { Routes } from '@angular/router'
import { unsavedChangesGuard } from '../../../shared/guards/can-deactivate.guard'

// System user creation/update are intentionally unavailable pending a safe
// backend System-only identity contract. Existing handler currently forces
// an invalid Master TenantId and always resets the password on update.
export default [
  {
    path: '',
    loadComponent: () =>
      import('./user-list/user-list.component').then((x) => x.UserListComponent),
    data: { breadcrumb: 'کاربران سیستم' },
  },
  {
    path: 'create',
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () =>
      import('./user-form/user-form.component').then((x) => x.UserFormComponent),
    data: { breadcrumb: 'کاربر جدید' },
  },
  {
    path: ':userId/edit',
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () =>
      import('./user-form/user-form.component').then((x) => x.UserFormComponent),
    data: { breadcrumb: 'ویرایش کاربر' },
  },
  { path: '**', redirectTo: '' },
] as Routes
