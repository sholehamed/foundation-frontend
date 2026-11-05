import { Routes } from '@angular/router';
import { PublicLayoutComponent } from '../../shared/layouts/public-layout/public-layout.component';
import { HomeComponent } from './home/home.component';

export default [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'start', loadChildren: () => import('./signup-checkout/routes-snippet').then(x=>x.routes) },
    ],
  },
] as Routes;
