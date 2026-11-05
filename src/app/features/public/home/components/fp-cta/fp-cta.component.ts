import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { CustomizerSettingsService } from '../../../../../shared/services/customizer-settings.service';

@Component({
    selector: 'app-fp-cta',
    imports: [RouterLink, MatButtonModule],
    templateUrl: './fp-cta.component.html',
    styleUrl: './fp-cta.component.scss'
})
export class FpCtaComponent {

    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}