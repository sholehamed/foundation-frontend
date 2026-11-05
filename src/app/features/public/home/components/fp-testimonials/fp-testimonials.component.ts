import { Component } from '@angular/core';
import { CustomizerSettingsService } from '../../../../../shared/services/customizer-settings.service';

@Component({
    selector: 'app-fp-testimonials',
    imports: [],
    templateUrl: './fp-testimonials.component.html',
    styleUrl: './fp-testimonials.component.scss'
})
export class FpTestimonialsComponent {

    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}