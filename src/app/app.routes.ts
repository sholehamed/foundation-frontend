import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/overview/overview.page').then(m => m.OverviewPage)
  },
  {
    path: 'system/status',
    loadComponent: () =>
      import('./features/system/system-status.page').then(m => m.SystemStatusPage)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
