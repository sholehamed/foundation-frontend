import { Routes } from '@angular/router'
import { legacySystemAccountCreateDenied, systemAccountLifecycleGuard } from './system-account-lifecycle.guard'

// Legacy form's generic User CRUD is unsafe. Create stays denied; the new
// edit route uses a narrow CAS/permission-gated lifecycle editor.
export default [
  {
    path: '',
    loadComponent: () =>
      import('./admin-list/admin-list.component').then((x) => x.AdminListComponent),
    data: { breadcrumb: 'مدیران سیستم' },
  },
  {
    path: 'create',
    canActivate: [legacySystemAccountCreateDenied],
    loadComponent: () =>
      import('./admin-form/admin-form.component').then((x) => x.AdminFormComponent),
    data: { breadcrumb: 'مدیر جدید (غیرفعال)' },
  },
  {
    path: ':userId/edit',
    canActivate: [systemAccountLifecycleGuard],
    loadComponent: () =>
      import('./system-account-lifecycle.component').then((x) => x.SystemAccountLifecycleComponent),
    data: { breadcrumb: 'مدیریت امن حساب مدیر' },
  },
  { path: '**', redirectTo: '' },
] as Routes
