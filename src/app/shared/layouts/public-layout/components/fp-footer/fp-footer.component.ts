import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomizerSettingsService } from '../../../../services/customizer-settings.service';

@Component({
    selector: 'app-fp-footer',
    imports: [RouterLink],
    templateUrl: './fp-footer.component.html',
    styleUrl: './fp-footer.component.scss'
})
export class FpFooterComponent {
currentYear = new Date().getFullYear();
    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}