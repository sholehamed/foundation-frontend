import { Component } from '@angular/core';
import { CustomizerSettingsService } from '../../../../../shared/services/customizer-settings.service';

@Component({
    selector: 'app-fp-key-features',
    imports: [],
    templateUrl: './fp-key-features.component.html',
    styleUrl: './fp-key-features.component.scss'
})
export class FpKeyFeaturesComponent {

    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}