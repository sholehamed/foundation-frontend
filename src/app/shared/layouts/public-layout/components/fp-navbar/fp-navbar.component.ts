import { NgClass } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { CustomizerSettingsService } from '../../../../services/customizer-settings.service';

@Component({
    selector: 'app-fp-navbar',
    imports: [RouterLink, NgClass, MatButtonModule],
    templateUrl: './fp-navbar.component.html',
    styleUrl: './fp-navbar.component.scss'
})
export class FpNavbarComponent {

    // Toggle Class
    classApplied = false;
    toggleClass(): void {
    this.classApplied = !this.classApplied;
}
closeMenu(): void {
    this.classApplied = false;
}
toggleTheme() {
        this.themeService.toggleTheme();
    }
    // Navbar Sticky
    isSticky: boolean = false;
    @HostListener('window:scroll')
    checkScroll() {
        const scrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        if (scrollPosition >= 50) {
            this.isSticky = true;
        } else {
            this.isSticky = false;
        }
    }

    constructor(
        public themeService: CustomizerSettingsService
    ) {}

}