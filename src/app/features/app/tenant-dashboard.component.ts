import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { TenantWorkspaceService, TenantWorkspaceSummary } from './tenant-workspace.service';

@Component({
  selector: 'app-tenant-dashboard',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  template: `
    <section class="tenant-page">
      <div class="tenant-page-heading">
        <div>
          <p class="eyebrow">TENANT WORKSPACE</p>
          <h1>نمای کلی فضای کاری</h1>
          <p>اطلاعات کسب‌وکار و شعبه‌های متعلق به حساب جاری.</p>
        </div>
        <button mat-stroked-button type="button" (click)="load()" [disabled]="loading()">
          به‌روزرسانی
        </button>
      </div>

      @if (loading()) {
        <div class="tenant-feedback" role="status">در حال دریافت اطلاعات فضای کاری...</div>
      } @else if (error()) {
        <div class="tenant-feedback error" role="alert">
          {{ error() }}
          <button mat-flat-button (click)="load()">تلاش مجدد</button>
        </div>
      } @else if (workspace(); as data) {
        <div class="tenant-cards">
          <article class="tenant-card">
            <span class="material-symbols-outlined" aria-hidden="true">storefront</span>
            <small>کسب‌وکار</small>
            <h2>{{ data.profile?.displayName || data.tenant.name }}</h2>
            <p>فضای کاری: {{ data.tenant.slug }}</p>
            <a routerLink="/dashboard/business">مشاهده اطلاعات</a>
          </article>
          <article class="tenant-card">
            <span class="material-symbols-outlined" aria-hidden="true">account_tree</span>
            <small>تعداد شعبه‌های ثبت‌شده</small>
            <h2>{{ data.branchesCount }}</h2>
            <p>شعبه اصلی: {{ data.mainBranch?.name || 'ثبت نشده' }}</p>
            <a routerLink="/dashboard/branches">مشاهده شعبه‌ها</a>
          </article>
          <article class="tenant-card">
            <span class="material-symbols-outlined" aria-hidden="true">assignment</span>
            <small>وضعیت درخواست اشتراک</small>
            <h2>در انتظار فعال‌سازی</h2>
            <p>پلن درخواستی: {{ data.profile?.requestedPlanKey || 'ثبت نشده' }}</p>
            <p class="notice">ثبت درخواست پلن به معنی فعال‌سازی اشتراک یا تأیید پرداخت نیست.</p>
          </article>
        </div>

        <div class="tenant-panel">
          <h2>اطلاعات سریع</h2>
          <dl class="tenant-details">
            <div><dt>نوع فعالیت</dt><dd>{{ data.profile?.activityType || '—' }}</dd></div>
            <div><dt>شهر کسب‌وکار</dt><dd>{{ data.profile?.city || '—' }}</dd></div>
            <div><dt>شعبه اصلی</dt><dd>{{ data.mainBranch?.name || '—' }}</dd></div>
            <div><dt>دوره پرداخت درخواستی</dt><dd>{{ data.profile?.requestedBillingCycle || '—' }}</dd></div>
          </dl>
        </div>
      }
    </section>
  `,
  styleUrl: './tenant-workspace.styles.scss',
})
export class TenantDashboardComponent implements OnInit {
  private readonly service = inject(TenantWorkspaceService);
  private readonly destroyRef = inject(DestroyRef);
  readonly workspace = signal<TenantWorkspaceSummary | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void { this.load(); }

  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.workspace.set(null);
    this.service.getWorkspace().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        if (!result?.tenant || !Number.isFinite(result.branchesCount)) {
          this.error.set('پاسخ فضای کاری ناقص است؛ نسخه Backend را بررسی کنید.');
        } else {
          this.workspace.set(result);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('دریافت اطلاعات فضای کاری انجام نشد.');
        this.loading.set(false);
      },
    });
  }
}
