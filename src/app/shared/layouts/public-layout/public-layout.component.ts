import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CustomizerSettingsService } from '../../services/customizer-settings.service';
import { CustomizerSettingsComponent } from '../dashboard-layout/common/customizer-settings/customizer-settings.component';
import { FpNavbarComponent } from './components/fp-navbar/fp-navbar.component';
import { FpFooterComponent } from './components/fp-footer/fp-footer.component';



@Component({
    selector: 'app-public-layout',
    imports: [RouterOutlet, FpNavbarComponent, FpFooterComponent, CustomizerSettingsComponent],
    templateUrl: './front-pages.component.html',
    styleUrl: './front-pages.component.scss'
})
export class PublicLayoutComponent {

    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}