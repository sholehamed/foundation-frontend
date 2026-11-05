import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CustomizerSettingsService } from '../../../../../shared/services/customizer-settings.service';

@Component({
    selector: 'app-fp-contact',
    imports: [MatFormFieldModule, MatInputModule, MatButtonModule],
    templateUrl: './fp-contact.component.html',
    styleUrl: './fp-contact.component.scss'
})
export class FpContactComponent {

    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}