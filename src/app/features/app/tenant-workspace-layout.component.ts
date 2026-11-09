import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../shared/services/auth.service';
import { BffTenantSessionService } from '../../shared/services/bff-tenant-session.service';
import { environment } from '../../../environments/environment';
import {
  TenantNavigationCategory, TenantPermissionKeys, TenantWorkspaceService,
} from './tenant-workspace.service';
import { TenantDynamicNavigationComponent } from './tenant-dynamic-navigation.component';

@Component({
  selector: 'app-tenant-workspace-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, TenantDynamicNavigationComponent],
  template: `
    <div class="tenant-shell" dir="rtl">
      <header class="tenant-bar">
        <a routerLink="/dashboard" class="tenant-brand" aria-label="صفحه اصلی فضای کاری">
          <span class="material-symbols-outlined" aria-hidden="true">space_dashboard</span>
          <span>Foundation <small>فضای کاری</small></span>
        </a>
        <nav aria-label="ناوبری فضای کاری">
          @if (dynamicNavigationEnabled) {
            <!-- Never fall back to static privileged links when dynamic
                 navigation is enabled but the permission API denies/fails. -->
            <app-tenant-dynamic-navigation [categories]="navigation()" />
          } @else {
          <a routerLink="/dashboard" [routerLinkActiveOptions]="{ exact: true }"
            routerLinkActive="selected">نمای کلی</a>
          <a routerLink="/dashboard/business" routerLinkActive="selected">اطلاعات کسب‌وکار</a>
          <a routerLink="/dashboard/branches" routerLinkActive="selected">شعبه‌ها</a>
          @if (allows('TENANT.MEMBERS.READ')) {
            <a routerLink="/dashboard/members" routerLinkActive="selected">اعضا</a>
          }
          @if (allows('TENANT.ROLES.READ')) {
            <a routerLink="/dashboard/roles" routerLinkActive="selected">نقش‌ها</a>
          }
          @if (allows('TENANT.GROUPS.READ')) {
            <a routerLink="/dashboard/groups" routerLinkActive="selected">گروه‌ها</a>
          }
          }
          @if (navigationEditorAllowed()) {
            <a routerLink="/dashboard/navigation" routerLinkActive="selected">
              تنظیم منو
            </a>
          }
        </nav>
        <button mat-stroked-button type="button" (click)="logout()">
          <span class="material-symbols-outlined" aria-hidden="true">logout</span>
          خروج
        </button>
      </header>
      @if (logoutError()) {
        <p role="alert" dir="rtl">{{ logoutError() }}</p>
      }
      <main class="tenant-content"><router-outlet /></main>
    </div>
  `,
  styleUrl: './tenant-workspace.styles.scss',
})
export class TenantWorkspaceLayoutComponent implements OnInit {
  private readonly workspace = inject(TenantWorkspaceService);
  private readonly destroyRef = inject(DestroyRef);
  readonly allowedPages = signal<ReadonlySet<string>>(new Set());
  readonly dynamicNavigationEnabled = environment.tenantDynamicNavigationPilotEnabled;
  readonly navigation = signal<TenantNavigationCategory[]>([]);
  readonly navigationEditorAllowed = signal(false);
  readonly logoutError = signal('');
  private readonly bff = inject(BffTenantSessionService);

  allows(key: string): boolean { return this.allowedPages().has(key); }

  ngOnInit(): void {
    // Management PAGE is separate from the menu tree and must be checked
    // live even when the dynamic sidebar is selected. No role-name shortcut.
    if (environment.tenantNavigationEditorPilotEnabled) {
      this.workspace.getUiAccess().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: snapshot => this.navigationEditorAllowed.set(
          Array.isArray(snapshot?.entries) && snapshot.entries.some(x =>
            x.key === TenantPermissionKeys.navigationRead &&
            x.kind === 'PAGE' && x.route === '/dashboard/navigation' &&
            x.allowed === true)),
        error: () => this.navigationEditorAllowed.set(false),
      });
    }

    if (this.dynamicNavigationEnabled) {
      // A failed/missing menu response is an empty navigation, never a
      // permissionless fallback. /dashboard brand link is always available.
      this.workspace.getNavigation()
        .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: categories => this.navigation.set(Array.isArray(categories)
            ? categories : []),
          error: () => this.navigation.set([]),
        });
      return;
    }

    // Do not infer access from a role name, tenant claim or a static sidebar.
    this.workspace.getUiAccess().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: snapshot => {
        const known = [
          { key: TenantPermissionKeys.members, route: '/dashboard/members' },
          { key: TenantPermissionKeys.roles, route: '/dashboard/roles' },
          { key: TenantPermissionKeys.groups, route: '/dashboard/groups' },
        ];
        const entries = Array.isArray(snapshot?.entries) ? snapshot.entries : [];
        this.allowedPages.set(new Set(known
          .filter(item => entries.some(access => access.key === item.key &&
            access.kind === 'PAGE' && access.route === item.route &&
            access.allowed === true))
          .map(item => item.key)));
      },
      error: () => this.allowedPages.set(new Set()),
    });
  }

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.logoutError.set('');
    if (environment.bffTenantPilotEnabled) {
      // Never merely clear local state and claim logout worked: the server
      // must revoke its opaque ticket. Surface a network error for retry.
      this.bff.logout().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => void this.router.navigateByUrl(
          '/auth/login', { replaceUrl: true }),
        error: () => this.logoutError.set(
          'خروج از نشست سرور تأیید نشد. دوباره تلاش کنید.'),
      });
      return;
    }

    this.auth.logout();
    void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
  }
}
