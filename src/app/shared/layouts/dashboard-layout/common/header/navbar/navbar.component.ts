import { Component, inject } from '@angular/core';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CustomizerSettingsService } from '../../../../../services/customizer-settings.service';

@Component({
    selector: 'app-navbar',
    imports: [RouterLinkActive, RouterLink, NgScrollbarModule],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
themeService: CustomizerSettingsService=inject(CustomizerSettingsService);
    

}