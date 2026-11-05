import { Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { CustomizerSettingsService } from '../../../../services/customizer-settings.service';

@Component({
    selector: 'app-customizer-settings',
    imports: [NgClass, MatDividerModule, MatButtonModule, NgScrollbarModule],
    templateUrl: './customizer-settings.component.html',
    styleUrl: './customizer-settings.component.scss'
})
export class CustomizerSettingsComponent {
themeService: CustomizerSettingsService=inject(CustomizerSettingsService);

   
    
    

    // Dark Mode
    toggleTheme() {
        this.themeService.toggleTheme();
    }

    // Sidebar Dark
    toggleSidebarTheme() {
        this.themeService.toggleSidebarTheme();
    }

    // Right Sidebar
    toggleRightSidebarTheme() {
        this.themeService.toggleRightSidebarTheme();
    }

    // Hide Sidebar
    toggleHideSidebarTheme() {
        this.themeService.toggleHideSidebarTheme();
    }

    // Header Dark Mode
    toggleHeaderTheme() {
        this.themeService.toggleHeaderTheme();
    }

    // Card Bordered
    toggleCardBorderedTheme() {
        this.themeService.toggleCardBorderedTheme();
    }

    // Navbar
    toggleNavbarTheme() {
        this.themeService.toggleNavbarTheme();
    }

    // Card Without Border Radius
    toggleCardWithoutBorderRadiusTheme() {
        this.themeService.toggleCardWithoutBorderRadiusTheme();
    }

    // Card With Box Shadow
    toggleCardWithBoxShadowTheme() {
        this.themeService.toggleCardWithBoxShadowTheme();
    }

    // RTL Mode
    toggleRTLEnabledTheme() {
        this.themeService.toggleRTLEnabledTheme();
    }

    // Body Bg Color
    toggleBodyBGTheme() {
        this.themeService.toggleBodyBGTheme();
    }

    // Settings Button Toggle
    toggle() {
        this.themeService.toggle();
    }

}