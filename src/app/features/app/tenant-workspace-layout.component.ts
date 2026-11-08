import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../shared/services/auth.service';
import { TenantPermissionKeys, TenantWorkspaceService } from './tenant-workspace.service';

@Component({
  selector: 'app-tenant-workspace-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule],
  template: `
    <div class="tenant-shell" dir="rtl">
      <header class="tenant-bar">
        <a routerLink="/dashboard" class="tenant-brand" aria-label="صفحه اصلی فضای کاری">
          <span class="material-symbols-outlined" aria-hidden="true">space_dashboard</span>
          <span>Foundation <small>فضای کاری</small></span>
        </a>
        <nav aria-label="ناوبری فضای کاری">
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
        </nav>
        <button mat-stroked-button type="button" (click)="logout()">
          <span class="material-symbols-outlined" aria-hidden="true">logout</span>
          خروج
        </button>
      </header>
      <main class="tenant-content"><router-outlet /></main>
    </div>
  `,
  styleUrl: './tenant-workspace.styles.scss',
})
export class TenantWorkspaceLayoutComponent implements OnInit {
  private readonly workspace = inject(TenantWorkspaceService);
  private readonly destroyRef = inject(DestroyRef);
  readonly allowedPages = signal<ReadonlySet<string>>(new Set());

  allows(key: string): boolean { return this.allowedPages().has(key); }

  ngOnInit(): void {
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
    this.auth.logout();
    void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
  }
}
