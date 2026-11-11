import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { forkJoin } from 'rxjs';
import { TenantPlanOrdersComponent } from './tenant-plan-orders.component';
import { TenantWorkspaceService, TenantWorkspaceSummary, TenantCommercialEntitlementSnapshot } from './tenant-workspace.service';

@Component({
  selector: 'app-tenant-dashboard',
  standalone: true,
  imports: [RouterLink, MatButtonModule, TenantPlanOrdersComponent],
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
            <span class="material-symbols-outlined" aria-hidden="true">verified_user</span>
            <small>وضعیت اشتراک تجاری</small>
            @if (subscription(); as license) {
              <h2>{{ subscriptionTitle(license.status) }}</h2>
              <p>پلن درخواست‌شده: {{ data.profile?.requestedPlanKey || 'ثبت نشده' }}</p>
              @if (license.hasCommercialEntitlement) {
                <p>ماژول‌های دارای مجوز: {{ license.moduleCodes.join('، ') }}</p>
                <p>پایان دوره: {{ license.endsAtUtc || '—' }}</p>
              } @else {
                <p class="notice">هیچ مجوز تجاری فعالی برای این فضای کاری تأیید نشده است.</p>
              }
              <p class="notice">این اطلاعات صرفاً گزارش وضعیت است؛ دسترسی هر کاربر همچنان جداگانه بررسی می‌شود.</p>
            } @else {
              <h2>وضعیت نامشخص</h2>
              <p class="notice">امکان تأیید وضعیت اشتراک از سرور وجود ندارد.</p>
            }
          </article>
        </div>

        <div class="tenant-panel">
          <button mat-stroked-button type="button"
            (click)="showOrderForm.set(!showOrderForm())">
            {{ showOrderForm() ? 'بستن سفارش‌ها' : 'مشاهده و ثبت سفارش پلن' }}
          </button>
          @if (showOrderForm()) { <app-tenant-plan-orders /> }
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
  readonly subscription = signal<TenantCommercialEntitlementSnapshot | null>(null);
  readonly showOrderForm = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  subscriptionTitle(status: TenantCommercialEntitlementSnapshot['status']): string {
    switch (status) {
      case 'Active': return 'اشتراک تجاری فعال';
      case 'Pending': return 'در انتظار تسویه تأییدشده';
      case 'Inactive': return 'اشتراک غیرفعال یا منقضی';
      case 'Invalid': return 'اشتراک فاقد تسویه معتبر';
      case 'Unavailable': return 'امکانات پلن در دسترس نیست';
      default: return 'اشتراک فعالی ثبت نشده';
    }
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.workspace.set(null);
    this.subscription.set(null);
    forkJoin({
      workspace: this.service.getWorkspace(),
      subscription: this.service.getSubscriptionShadow(),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ workspace, subscription }) => {
        if (!workspace?.tenant || !Number.isFinite(workspace.branchesCount)) {
          this.error.set('پاسخ فضای کاری ناقص است؛ نسخه Backend را بررسی کنید.');
        } else {
          this.workspace.set(workspace);
          this.subscription.set(subscription);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('دریافت وضعیت فضای کاری یا اشتراک انجام نشد.');
        this.loading.set(false);
      },
    });
  }
}
