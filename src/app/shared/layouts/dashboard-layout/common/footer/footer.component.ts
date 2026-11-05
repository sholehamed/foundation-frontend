import { Component, inject } from '@angular/core';
import { CustomizerSettingsService } from '../../../../services/customizer-settings.service';

@Component({
    selector: 'app-footer',
    imports: [],
    templateUrl: './footer.component.html',
    styleUrl: './footer.component.scss',
        standalone: true

})
export class FooterComponent {

    themeService: CustomizerSettingsService=inject(CustomizerSettingsService);
currentYear = new Date().getFullYear();

}