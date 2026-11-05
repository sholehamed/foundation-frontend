// app.routes.ts (or your public route file)
import { Routes } from '@angular/router';
import { SignupCheckoutComponent } from './signup-checkout.component';

export const routes: Routes = [
    {
        path: '',
        component: SignupCheckoutComponent
    },
    {
        // Allows: /start/salon-pro
        path: ':plan',
        component: SignupCheckoutComponent
    }
];

// Also supported by the component:
// /start?plan=salon-pro
