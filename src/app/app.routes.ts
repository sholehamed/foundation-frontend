import { Routes } from '@angular/router';
import { SignInComponent } from './shared/pages/auth/sign-in/sign-in.component';
import { tenantSessionGuard } from './shared/guards/tenant-session.guard';

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
    loadComponent: () => import('./features/app/tenant-dashboard.component')
      .then(x => x.TenantDashboardComponent),
  },
  {
    path: 'auth',
    children: [{ path: 'login', component: SignInComponent, data: { login_context: 'tenant' } }],
  },
];
