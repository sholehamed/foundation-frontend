import { CommonModule, NgClass } from '@angular/common';
import { Component, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';
import { ToggleService } from '../header/toggle.service';
import { MenuCategoryDto, SidebarMenuService, filterSystemNavigation } from './sidebar-menu.service';
import { SystemUiAccessService } from '../../../../permissions/system-ui-access.service';
import { SYSTEM_UI_ACCESS_PILOT_ENABLED } from '../../../../permissions/system-ui-access-pilot.token';
import { forkJoin, map } from 'rxjs';
import { SidebarMenuItemComponent } from './sidebar-menu-item.component/sidebar-menu-item.component';
import { TenantContextService } from '../../../../services/tenant-context.service';
import { CustomizerSettingsService } from '../../../../services/customizer-settings.service';
import { FileService } from '../../../../components/avatar-upload/upload.service';
import { NgScrollbarModule } from 'ngx-scrollbar';

@Component({
  selector: 'app-sidebar',
  imports: [
    CommonModule,
    NgClass,
    RouterLink,
    MatExpansionModule,
    SidebarMenuItemComponent,
    NgScrollbarModule,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  standalone: true,
})
export class SidebarComponent implements OnInit, OnDestroy {
  protected readonly _tenantContext = inject(TenantContextService);
  private readonly _fileService = inject(FileService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toggleService = inject(ToggleService);
  readonly themeService = inject(CustomizerSettingsService);
  private readonly menuService = inject(SidebarMenuService);
  private readonly router = inject(Router);
  private readonly pilotEnabled = inject(SYSTEM_UI_ACCESS_PILOT_ENABLED);
  private readonly uiAccess = this.pilotEnabled ? inject(SystemUiAccessService) : null;

  readonly isSidebarToggled = this.toggleService.isSidebarToggled;
  readonly isToggled = this.themeService.isNavbarToggled;
  readonly menuSections = signal<MenuCategoryDto[]>([]);
  readonly isMenuLoading = signal(false);
  readonly menuError = signal(false);
  readonly homeRoute = this.router.url.startsWith('/system/')
    ? '/system/dashboard'
    : '/dashboard';

  // Branding is optional; a System host has no TenantContext.
  _logoSrc = 'shinera-dark-logo.png';
  private logoObjectUrl: string | null = null;

  ngOnInit(): void {
    this.loadMenu();

    const logoId = this._tenantContext.current?.logo?.trim();
    if (!logoId) return;

    this._fileService.preview(logoId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: blob => this.setPreview(blob),
        error: () => { this._logoSrc = 'shinera-dark-logo.png'; },
      });
  }

  ngOnDestroy(): void {
    if (this.logoObjectUrl) {
      URL.revokeObjectURL(this.logoObjectUrl);
      this.logoObjectUrl = null;
    }
  }

  private setPreview(blob: Blob): void {
    if (this.logoObjectUrl) URL.revokeObjectURL(this.logoObjectUrl);
    this.logoObjectUrl = URL.createObjectURL(blob);
    this._logoSrc = this.logoObjectUrl;
  }

  private loadMenu(): void {
    this.isMenuLoading.set(true);
    this.menuError.set(false);
    this.menuSections.set([]);

    const menuSource = this.pilotEnabled && this.homeRoute === '/system/dashboard'
      ? forkJoin({
          sections: this.menuService.getMyNavigation(),
          snapshot: this.uiAccess!.snapshot(),
        }).pipe(map(({ sections, snapshot }) => filterSystemNavigation(sections, snapshot)))
      : this.menuService.getMyNavigation();

    menuSource.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: sections => {
          this.menuSections.set(sections);
          this.isMenuLoading.set(false);
        },
        error: error => {
          console.error('Failed to load current-user navigation', error);
          // Fail closed: a failed call must never become an admin menu.
          this.menuSections.set([]);
          this.menuError.set(true);
          this.isMenuLoading.set(false);
        },
      });
  }

  retryMenu(): void {
    this.loadMenu();
  }

  toggle(): void {
    this.toggleService.toggle();
  }
}
