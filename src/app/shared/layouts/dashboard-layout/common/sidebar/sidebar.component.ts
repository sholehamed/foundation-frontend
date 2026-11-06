import { CommonModule, NgClass } from '@angular/common'
import { Component, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Router, RouterLink, RouterLinkActive } from '@angular/router'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSelectModule } from '@angular/material/select'
import { ToggleService } from '../header/toggle.service'
import { MenuCategoryDto, SidebarMenuService, SidebarRole } from './sidebar-menu.service'
import { TenantContextService } from '../../../../services/tenant-context.service'
import { CustomizerSettingsService } from '../../../../services/customizer-settings.service'
import { FileService } from '../../../../components/avatar-upload/upload.service'
import { NgScrollbarModule } from 'ngx-scrollbar'

@Component({
  selector: 'app-sidebar',
  imports: [
    CommonModule,
    NgClass,
    RouterLink,
    RouterLinkActive,
    MatExpansionModule,
    MatFormFieldModule,
    MatSelectModule,
    NgScrollbarModule,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  standalone: true,
})
export class SidebarComponent implements OnInit, OnDestroy {
  protected readonly _tenantContext = inject(TenantContextService)
  private readonly _fileService = inject(FileService)
  private readonly destroyRef = inject(DestroyRef)
  private readonly toggleService = inject(ToggleService)
  readonly themeService = inject(CustomizerSettingsService)
  private readonly menuService = inject(SidebarMenuService)
  private readonly router = inject(Router)

  readonly isSidebarToggled = this.toggleService.isSidebarToggled
  readonly isToggled = this.themeService.isNavbarToggled
  readonly panelOpenState = signal(false)

  // تبدیل به signal
  readonly roles = signal<SidebarRole[]>([])
  readonly selectedRole = signal<SidebarRole | null>(null)
  readonly menuSections = signal<MenuCategoryDto[]>([])
  readonly isMenuLoading = signal(false)
  // System administration has no tenant context; a tenant may have no logo.
  // Never block sidebar/menu initialization while optional branding loads.
  _logoSrc = 'shinera-dark-logo.png'
  private logoObjectUrl: string | null = null

  ngOnInit(): void {
    this.loadRoles()

    const logoId = this._tenantContext.current?.logo?.trim()
    if (!logoId) return

    this._fileService.preview(logoId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => this.setPreview(blob),
        // Missing/deleted media is optional branding; retain the default logo.
        error: () => { this._logoSrc = 'shinera-dark-logo.png' },
      })
  }

  ngOnDestroy(): void {
    if (this.logoObjectUrl) {
      URL.revokeObjectURL(this.logoObjectUrl)
      this.logoObjectUrl = null
    }
  }

  private setPreview(blob: Blob): void {
    if (this.logoObjectUrl) URL.revokeObjectURL(this.logoObjectUrl)
    this.logoObjectUrl = URL.createObjectURL(blob)
    this._logoSrc = this.logoObjectUrl
  }
  onRoleChange(role: SidebarRole): void {
    this.selectedRole.set(role)
    this.loadMenu(role.id)
  }

  private loadMenu(roleId: string): void {
    this.isMenuLoading.set(true)

    this.menuService.getMenuByRole(roleId).subscribe({
      next: (menuSections) => {
        this.menuSections.set(
          this.addAccessManagementLinks(
            menuSections.length ? menuSections : this.systemFallbackMenu()
          )
        )
        this.isMenuLoading.set(false)
      },
      error: (error) => {
        console.error('Failed to load sidebar menu', error)
        this.menuSections.set(this.addAccessManagementLinks(this.systemFallbackMenu()))
        this.isMenuLoading.set(false)
      },
    })
  }

  private loadRoles(): void {
    this.menuService.getRoles().subscribe({
      next: (roles) => {
        this.roles.set(roles)

        if (roles.length > 0) {
          this.selectedRole.set(roles[0])
          this.loadMenu(roles[0].id)
        } else {
          this.menuSections.set(this.addAccessManagementLinks(this.systemFallbackMenu()))
        }
      },
      error: (error) => {
        console.error('Failed to load sidebar roles', error)
        this.menuSections.set([])
      },
    })
  }

  /** Curated System navigation: merge into existing dynamic menu rather than
   * replacing configured menus, and never add duplicate destinations.
   * All endpoints still enforce SystemAdministrator on the server. */
  private addAccessManagementLinks(sections: MenuCategoryDto[]): MenuCategoryDto[] {
    if (
      !this.router.url.startsWith('/system/') ||
      this.router.url.startsWith('/system/auth/')
    )
      return sections
    const links = [
      { title: 'منابع', icon: 'category', route: '/system/resources', childs: [] },
      { title: 'منابع API', icon: 'api', route: '/system/api-resources', childs: [] },
      {
        title: 'منابع رابط کاربری',
        icon: 'web',
        route: '/system/ui-resources',
        childs: [],
      },
      {
        title: 'مجوزها',
        icon: 'verified_user',
        route: '/system/permissions',
        childs: [],
      },
    ]
    const existing = new Set<string>()
    const collect = (items: MenuCategoryDto['items']) => {
      for (const item of items) {
        if (item.route)
          existing.add(
            (item.route.endsWith('/')
              ? item.route.slice(0, -1)
              : item.route
            ).toLowerCase()
          )
        collect(item.childs ?? [])
      }
    }
    sections.forEach((section) => collect(section.items))
    const missing = links.filter((link) => !existing.has(link.route.toLowerCase()))
    if (!missing.length) return sections
    return [...sections, { title: 'مدیریت دسترسی', items: missing }]
  }

  /** This is navigation only, not an authorization source. The backend
   * verifies live SystemAdministrator membership for every API request. */
  private systemFallbackMenu(): MenuCategoryDto[] {
    if (
      !this.router.url.startsWith('/system/') ||
      this.router.url.startsWith('/system/auth/')
    )
      return []
    return [
      {
        title: 'مدیریت سیستم',
        items: [
          { title: 'داشبورد', icon: 'dashboard', route: '/system/dashboard', childs: [] },
          {
            title: 'کسب‌وکارها',
            icon: 'storefront',
            route: '/system/tenants',
            childs: [],
          },
          { title: 'کاربران', icon: 'group', route: '/system/users', childs: [] },
          { title: 'نقش‌ها', icon: 'shield_person', route: '/system/roles', childs: [] },
          { title: 'گروه‌ها', icon: 'groups', route: '/system/groups', childs: [] },
          { title: 'ماژول‌ها', icon: 'widgets', route: '/system/modules', childs: [] },
          {
            title: 'مجوزها',
            icon: 'verified_user',
            route: '/system/permissions',
            childs: [],
          },
          {
            title: 'مدیریت منو',
            icon: 'menu',
            route: '/system/menu-management',
            childs: [],
          },
        ],
      },
    ]
  }

  toggle(): void {
    this.toggleService.toggle()
  }
}
