import { Component } from '@angular/core';
import { FpBannerComponent } from './components/fp-banner/fp-banner.component';
import { FpContactComponent } from './components/fp-contact/fp-contact.component';
import { FpCtaComponent } from './components/fp-cta/fp-cta.component';
import { FpFaqComponent } from './components/fp-faq/fp-faq.component';
import { FpKeyFeaturesComponent } from './components/fp-key-features/fp-key-features.component';
import { FpTestimonialsComponent } from './components/fp-testimonials/fp-testimonials.component';
import { FpWidgetsComponent } from './components/fp-widgets/fp-widgets.component';
import { PlansComponent } from './components/Plans/plans.component';


@Component({
    selector: 'app-home',
    imports: [FpBannerComponent, FpKeyFeaturesComponent,PlansComponent, FpWidgetsComponent, FpTestimonialsComponent, FpFaqComponent, FpContactComponent, FpCtaComponent],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss'
})
export class HomeComponent {}