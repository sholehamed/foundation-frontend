import { Component, signal } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { CustomizerSettingsService } from '../../../../../shared/services/customizer-settings.service';

@Component({
    selector: 'app-fp-faq',
    imports: [MatExpansionModule],
    templateUrl: './fp-faq.component.html',
    styleUrl: './fp-faq.component.scss'
})
export class FpFaqComponent {

    readonly panelOpenState = signal(false);

    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}