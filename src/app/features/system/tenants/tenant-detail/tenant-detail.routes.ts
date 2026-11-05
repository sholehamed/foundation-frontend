import { Routes } from '@angular/router';

// Only real, live API-backed tenant detail pages belong in this release.
// Additional tenant-specific users/roles/groups are separate future domain slices.
export default [{
  path: '',
  loadComponent: () => import('./tenant-detail.component').then(x => x.TenantDetailComponent),
  children: [
    { path: '', redirectTo: 'overview', pathMatch: 'full' },
    {
      path: 'overview',
      loadComponent: () => import('./tenant-overview/tenant-overview.component')
        .then(x => x.TenantOverviewComponent),
      data: { breadcrumb: 'جزئیات کسب‌وکار' }
    },
    { path: '**', redirectTo: 'overview' }
  ]
}] as Routes;
