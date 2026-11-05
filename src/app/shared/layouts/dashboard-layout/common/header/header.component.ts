import { filter } from 'rxjs/operators';
import { ToggleService } from './toggle.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { NavbarComponent } from './navbar/navbar.component';
import { NgClass, isPlatformBrowser } from '@angular/common';
import { RouterLink, NavigationEnd, Router } from '@angular/router';
import { Component, HostListener, inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { AuthService } from '../../../../services/auth.service';
import { CustomizerSettingsService } from '../../../../services/customizer-settings.service';
import { AvatarUploadComponent } from '../../../../components/avatar-upload/avatar-upload.component';



@Component({
    selector: 'app-header',
    imports: [RouterLink, MatButtonModule, MatMenuModule, NgClass, NavbarComponent, AvatarUploadComponent],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss',
        standalone: true

})
export class HeaderComponent implements AfterViewInit {

    private toggleService = inject(ToggleService);
    public themeService = inject(CustomizerSettingsService);
    private platformId = inject(PLATFORM_ID);
    private router = inject(Router);
    protected auth = inject(AuthService);

    isSidebarToggled = this.toggleService.isSidebarToggled;
    isToggled = this.themeService.isNavbarToggled;

    constructor() {
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            if (this.isSidebarToggled()) {
                this.toggleService.toggle();
            }
        });
    }

    toggle() { this.toggleService.toggle(); }
    settingsButtonToggle() { this.themeService.toggle(); }
    toggleTheme() { this.themeService.toggleTheme(); }

    isSticky = false;
    @HostListener('window:scroll')
    checkScroll() {
        const scrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        this.isSticky = scrollPosition >= 50;
    }

    isFullscreen = false;
    ngAfterViewInit() {
        if (isPlatformBrowser(this.platformId)) {
            ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange']
                .forEach(e => document.addEventListener(e, this.onFullscreenChange.bind(this)));
        }
    }
    toggleFullscreen() {
        this.isFullscreen ? this.closeFullscreen() : this.openFullscreen();
    }
    openFullscreen() {
        if (!isPlatformBrowser(this.platformId)) return;
        const el = document.documentElement as any;
        (el.requestFullscreen ?? el.mozRequestFullScreen ?? el.webkitRequestFullscreen ?? el.msRequestFullscreen)?.call(el);
    }
    closeFullscreen() {
        if (!isPlatformBrowser(this.platformId)) return;
        const doc = document as any;
        (doc.exitFullscreen ?? doc.mozCancelFullScreen ?? doc.webkitExitFullscreen ?? doc.msExitFullscreen)?.call(doc);
    }
    onFullscreenChange() {
        if (isPlatformBrowser(this.platformId)) {
            const doc = document as any;
            this.isFullscreen = !!(doc.fullscreenElement ?? doc.webkitFullscreenElement ?? doc.mozFullScreenElement ?? doc.msFullscreenElement);
        }
    }
}
