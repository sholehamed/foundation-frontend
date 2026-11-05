import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CustomizerSettingsComponent } from './common/customizer-settings/customizer-settings.component';
import { FooterComponent } from './common/footer/footer.component';
import { HeaderComponent } from './common/header/header.component';
import { ToggleService } from './common/header/toggle.service';
import { SidebarComponent } from './common/sidebar/sidebar.component';
import { CustomizerSettingsService } from '../../services/customizer-settings.service';

@Component({
    selector: 'app-panel-layout',
    imports: [RouterOutlet, NgClass, HeaderComponent, SidebarComponent, FooterComponent, CustomizerSettingsComponent],
    templateUrl: './panel-layout.component.html',
    styleUrl: './panel-layout.component.scss',
        standalone: true

})
export class PanelLayoutComponent {
    private readonly toggleService = inject(ToggleService);
    readonly themeService = inject(CustomizerSettingsService);

    readonly isSidebarToggled = this.toggleService.isSidebarToggled;
    readonly isToggled = this.themeService.isNavbarToggled;
}
