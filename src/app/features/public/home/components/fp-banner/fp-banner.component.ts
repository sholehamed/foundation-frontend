import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { CustomizerSettingsService } from '../../../../../shared/services/customizer-settings.service';

@Component({
    selector: 'app-fp-banner',
    imports: [MatButtonModule,RouterLink],
    templateUrl: './fp-banner.component.html',
    styleUrl: './fp-banner.component.scss'
})
export class FpBannerComponent {

    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}