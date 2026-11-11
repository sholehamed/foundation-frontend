import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { forkJoin } from 'rxjs';
import { TenantPlanOrdersComponent } from './tenant-plan-orders.component';
import { TenantPlanAllowancesComponent } from './tenant-plan-allowances.component';
import { TenantUsageOverviewComponent } from './tenant-usage-overview.component';
import {
  TenantWorkspaceService, TenantWorkspaceSummary, TenantCommercialEntitlementSnapshot,
} from './tenant-workspace.service';

@Component({
  selector: 'app-tenant-dashboard',
  standalone: true,
  imports: [RouterLink, MatButtonModule, TenantPlanOrdersComponent,
    TenantPlanAllowancesComponent, TenantUsageOverviewComponent],
  template: `
    <section class="tenant-page tenant-command-center">
      <header class="tenant-page-heading tenant-dashboard-heading">
        <div>
          <p class="eyebrow">FOUNDATION · WORKSPACE</p>
          <h1>داشبورد فضای کاری</h1>
          <p>مروری روشن بر کسب‌وکار، شعبه‌ها و وضعیت اشتراک شما.</p>
        </div>
        <button mat-stroked-button type="button" (click)="load()" [disabled]="loading()">
          <span class="material-symbols-outlined" aria-hidden="true">refresh</span>
          به‌روزرسانی
        </button>
      </header>

      @if (loading()) {
        <div class="tenant-feedback" role="status">در حال دریافت اطلاعات فضای کاری...</div>
      } @else if (error()) {
        <div class="tenant-feedback error" role="alert">
          {{ error() }}
          <button mat-flat-button type="button" (click)="load()">تلاش مجدد</button>
        </div>
      } @else if (workspace(); as data) {
        <section class="tenant-command-hero" aria-label="خلاصه فضای کاری">
          <div class="tenant-command-hero-copy">
            <div class="tenant-hero-mark">
              <span class="material-symbols-outlined" aria-hidden="true">space_dashboard</span>
              <span>نمای مدیریت کسب‌وکار</span>
            </div>
            <h2>{{ data.profile?.displayName || data.tenant.name }}</h2>
            <p>اطلاعات ثبت‌شده این فضای کاری، بدون اعداد تخمینی یا داده‌های نمونه.</p>
            <div class="tenant-hero-pills">
              <span class="tenant-hero-pill">
                <span class="material-symbols-outlined" aria-hidden="true">domain</span>
                {{ data.branchesCount }} شعبه ثبت‌شده
              </span>
              <span class="tenant-hero-pill" [class.tenant-pill-active]="subscription()?.hasCommercialEntitlement">
                <span class="material-symbols-outlined" aria-hidden="true">workspace_premium</span>
                {{ subscriptionTitle(subscription()?.status || 'Unavailable') }}
              </span>
            </div>
          </div>
          <div class="tenant-hero-side">
            <span class="tenant-hero-side-icon material-symbols-outlined" aria-hidden="true">storefront</span>
            <small>شناسه فضای کاری</small>
            <strong dir="ltr">{{ data.tenant.slug }}</strong>
            <a routerLink="/dashboard/business">جزئیات کسب‌وکار
              <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
            </a>
          </div>
        </section>

        <div class="tenant-command-metrics" aria-label="شاخص‌های فضای کاری">
          <article class="tenant-command-metric">
            <div class="tenant-command-metric-top">
              <span class="material-symbols-outlined" aria-hidden="true">account_tree</span>
              <small>شعبه‌های ثبت‌شده</small>
            </div>
            <strong>{{ data.branchesCount }}</strong>
            <p>شعبه اصلی: {{ data.mainBranch?.name || 'ثبت نشده' }}</p>
          </article>
          <article class="tenant-command-metric">
            <div class="tenant-command-metric-top">
              <span class="material-symbols-outlined" aria-hidden="true">location_city</span>
              <small>شهر کسب‌وکار</small>
            </div>
            <strong class="textual">{{ data.profile?.city || 'ثبت نشده' }}</strong>
            <p>بر اساس اطلاعات پروفایل</p>
          </article>
          <article class="tenant-command-metric">
            <div class="tenant-command-metric-top">
              <span class="material-symbols-outlined" aria-hidden="true">extension</span>
              <small>ماژول‌های تجاری مجاز</small>
            </div>
            <strong>{{ subscription()?.hasCommercialEntitlement ? subscription()?.moduleCodes?.length : 0 }}</strong>
            <p>صرفاً بر اساس اشتراک تأییدشده</p>
          </article>
          <article class="tenant-command-metric">
            <div class="tenant-command-metric-top">
              <span class="material-symbols-outlined" aria-hidden="true">event_available</span>
              <small>پایان اشتراک تجاری</small>
            </div>
            <strong class="textual">{{ formatPersianDate(subscription()?.endsAtUtc) }}</strong>
            <p>تنها در صورت وجود دوره تأییدشده</p>
          </article>
        </div>

        <div class="tenant-command-columns">
          <section class="tenant-panel tenant-command-subscription">
            <div class="tenant-command-panel-title">
              <div>
                <span class="tenant-command-section-kicker">SUBSCRIPTION</span>
                <h2>وضعیت اشتراک تجاری</h2>
                <p>اشتراک به‌تنهایی مجوز دسترسی کاربر نیست.</p>
              </div>
              <span class="material-symbols-outlined" aria-hidden="true">verified_user</span>
            </div>
            @if (subscription(); as license) {
              <span class="tenant-command-status" [class.is-active]="license.hasCommercialEntitlement">
                <span class="material-symbols-outlined" aria-hidden="true">
                  {{ license.hasCommercialEntitlement ? 'check_circle' : 'info' }}
                </span>
                {{ subscriptionTitle(license.status) }}
              </span>
              @if (license.hasCommercialEntitlement) {
                <p>ماژول‌های دارای مجوز: {{ license.moduleCodes.join('، ') }}</p>
                <p>پایان دوره: {{ formatPersianDate(license.endsAtUtc) }}</p>
              } @else {
                <p class="notice">هیچ مجوز تجاری فعالی برای این فضای کاری تأیید نشده است.</p>
              }
            } @else {
              <p class="notice">امکان تأیید وضعیت اشتراک از سرور وجود ندارد.</p>
            }
            <div class="tenant-command-footnote">
              <span class="material-symbols-outlined" aria-hidden="true">info</span>
              پلن درخواستی: {{ data.profile?.requestedPlanKey || 'ثبت نشده' }}
              <span class="tenant-command-separator">·</span>
              دوره درخواستی: {{ data.profile?.requestedBillingCycle || 'ثبت نشده' }}
            </div>
          </section>

          <section class="tenant-panel tenant-command-actions" aria-label="دسترسی‌های سریع">
            <div class="tenant-command-panel-title">
              <div>
                <span class="tenant-command-section-kicker">QUICK ACTIONS</span>
                <h2>دسترسی‌های سریع</h2>
                <p>برای مدیریت بخش‌های فعلی فضای کاری.</p>
              </div>
            </div>
            <div class="tenant-command-action-list">
              <a routerLink="/dashboard/business" class="tenant-command-action">
                <span class="material-symbols-outlined" aria-hidden="true">store</span>
                <span><strong>اطلاعات کسب‌وکار</strong><small>مشاهده مشخصات ثبت‌شده</small></span>
                <span class="material-symbols-outlined" aria-hidden="true">chevron_left</span>
              </a>
              <a routerLink="/dashboard/branches" class="tenant-command-action">
                <span class="material-symbols-outlined" aria-hidden="true">account_tree</span>
                <span><strong>شعبه‌ها</strong><small>فهرست شعبه‌های همین Tenant</small></span>
                <span class="material-symbols-outlined" aria-hidden="true">chevron_left</span>
              </a>
              <button type="button" class="tenant-command-action"
                (click)="showOrderForm.set(!showOrderForm())">
                <span class="material-symbols-outlined" aria-hidden="true">receipt_long</span>
                <span><strong>{{ showOrderForm() ? 'بستن سفارش‌ها' : 'سفارش‌ها و پلن‌ها' }}</strong>
                  <small>مشاهده و ثبت درخواست پلن</small></span>
                <span class="material-symbols-outlined" aria-hidden="true">chevron_left</span>
              </button>
            </div>
          </section>
        </div>

        @if (showOrderForm()) {
          <div class="tenant-panel tenant-command-orders">
            <app-tenant-plan-orders />
          </div>
        }

        @if (subscription(); as license) {
          @if (license.hasCommercialEntitlement) {
            <app-tenant-plan-allowances class="tenant-panel" [capabilities]="license.capabilities" />
            <app-tenant-usage-overview />
          }
        }

        <section class="tenant-panel tenant-command-details">
          <div class="tenant-command-panel-title">
            <div>
              <span class="tenant-command-section-kicker">WORKSPACE PROFILE</span>
              <h2>اطلاعات سریع</h2>
              <p>برگرفته از مشخصات ثبت‌شده فضای کاری.</p>
            </div>
          </div>
          <dl class="tenant-details">
            <div><dt>نوع فعالیت</dt><dd>{{ data.profile?.activityType || '—' }}</dd></div>
            <div><dt>شهر کسب‌وکار</dt><dd>{{ data.profile?.city || '—' }}</dd></div>
            <div><dt>شعبه اصلی</dt><dd>{{ data.mainBranch?.name || '—' }}</dd></div>
            <div><dt>دوره پرداخت درخواستی</dt><dd>{{ data.profile?.requestedBillingCycle || '—' }}</dd></div>
          </dl>
        </section>
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

  /** The underlying instant is UTC; only the display uses a Jalali calendar. */
  formatPersianDate(value: string | null | undefined): string {
    if (!value) return '—';
    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime())) return '—';
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric',
    }).format(parsed);
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
