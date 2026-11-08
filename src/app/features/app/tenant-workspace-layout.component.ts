import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../shared/services/auth.service';
import { TenantWorkspaceService } from './tenant-workspace.service';

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
          @if (canViewAdministration()) {
            <a routerLink="/dashboard/members" routerLinkActive="selected">اعضا</a>
            <a routerLink="/dashboard/roles" routerLinkActive="selected">نقش‌ها</a>
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
  readonly canViewAdministration = signal(false);
  ngOnInit(): void {
    this.workspace.getAdminCapabilities().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: value => this.canViewAdministration.set(value?.canViewAdministration === true),
      error: () => this.canViewAdministration.set(false),
    });
  }

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
  }
}
