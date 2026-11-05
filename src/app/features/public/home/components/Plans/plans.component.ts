import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { CustomizerSettingsService } from '../../../../../shared/services/customizer-settings.service';
@Component({
    selector: 'app-plans',
    imports: [MatCardModule, MatButtonModule,RouterLink],
    templateUrl: './plans.component.html',
    styleUrl: './plans.component.scss'
})
export class PlansComponent {

    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}