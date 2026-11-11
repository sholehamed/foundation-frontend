import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import {
  TenantUsageMetric, TenantUsageProjection, TenantWorkspaceService,
} from './tenant-workspace.service';

/**
 * FR-17D-2B: real READ-ONLY server usage, not client-side quota enforcement.
 * Backend deliberately restricts this endpoint to the current Tenant Owner;
 * 403 is an expected, private state for other Tenant members.
 */
@Component({
  selector: 'app-tenant-usage-overview',
  standalone: true,
  imports: [MatButtonModule],
  template: `
    <section aria-labelledby="tenant-usage-title">
      <div class="usage-heading">
        <div>
          <h2 id="tenant-usage-title">مصرف منابع اشتراک</h2>
          <p>مصرف ثبت‌شده در سرور، در دوره معتبر اشتراک</p>
        </div>
        <button type="button" mat-stroked-button (click)="load()"
                [disabled]="loading()">به‌روزرسانی مصرف</button>
      </div>

      @if (loading()) {
        <p role="status" class="usage-info">در حال دریافت اطلاعات مصرف...</p>
      } @else if (restricted()) {
        <p class="usage-info">گزارش مصرف فقط برای مالک این فضای کاری قابل مشاهده است.</p>
      } @else if (error()) {
        <div class="usage-error" role="alert">
          {{ error() }}
          <button type="button" mat-button (click)="load()">تلاش مجدد</button>
        </div>
      } @else if (usage(); as report) {
        @if (report.status !== 'Active') {
          <p class="usage-info">اشتراک تجاری فعالی برای گزارش مصرف تأیید نشده است.</p>
        } @else if (report.items.length === 0) {
          <p class="usage-info">برای این اشتراک، محدودیت قابل اندازه‌گیری ثبت نشده است.</p>
        } @else {
          <div class="usage-grid">
            @for (item of report.items; track item.code) {
              <article class="usage-item">
                <div class="usage-item-heading">
                  <code dir="ltr">{{ item.code }}</code>
                  <span class="usage-kind">
                    {{ item.kind === 'CountLimit' ? 'ظرفیت هم‌زمان' : 'سهمیه دوره‌ای' }}
                  </span>
                </div>
                <div class="usage-limit">
                  <small>سقف پلن</small>
                  <strong>{{ item.isUnlimited ? 'نامحدود' : formatUnits(item.limit) }}</strong>
                </div>
                @if (item.state === 'Measured') {
                  <dl class="usage-numbers">
                    <div>
                      <dt>مصرف ثبت‌شده</dt>
                      <dd>{{ formatUnits(item.currentUsage) }}</dd>
                    </div>
                    <div>
                      <dt>باقی‌مانده</dt>
                      <dd>{{ item.isUnlimited ? 'نامحدود' : formatUnits(item.remaining) }}</dd>
                    </div>
                  </dl>
                  @if (item.overLimit) {
                    <p class="usage-warning">مصرف ثبت‌شده از سقف فعلی پلن بیشتر است.</p>
                  }
                  @if (item.periodEndUtc) {
                    <p class="usage-period">
                      پایان دوره (UTC): {{ formatPersianDate(item.periodEndUtc) }}
                    </p>
                  }
                } @else {
                  <p class="usage-unknown">{{ stateMessage(item.state) }}</p>
                }
              </article>
            }
          </div>
        }
      }
      <p class="usage-disclaimer">
        این گزارش برای اطلاع‌رسانی است؛ تأیید یا رد عملیات فقط توسط Backend
        و در تراکنش معتبر انجام می‌شود. شمارش منابع فعال تا اتصال شمارنده
        اختصاصی آن‌ها نمایش داده نمی‌شود.
      </p>
    </section>
  `,
  styles: [`
    :host { display:block; margin-top:20px; padding:24px; background:var(--whiteColor,#fff);
      color:var(--headingColor,#272936); border:1px solid var(--borderColor,#e6e5ed);
      border-radius:17px; box-shadow:0 7px 30px rgba(45,32,44,.035); }
    .usage-heading { display:flex; align-items:start; justify-content:space-between;
      flex-wrap:wrap; gap:12px; }
    .usage-heading h2 { margin:0 0 6px; font-size:19px; }
    .usage-heading p { margin:0; font-size:12px; color:var(--bodyColor,#777985); line-height:1.9; }
    .usage-grid { margin-top:20px; display:grid; gap:14px;
      grid-template-columns:repeat(auto-fit,minmax(225px,1fr)); }
    .usage-item { min-width:0; border:1px solid var(--borderColor,#e7e5ed); border-radius:13px;
      padding:17px; background:var(--bodyBackgroundColor,#faf9fb); }
    .usage-item-heading { display:flex; flex-wrap:wrap; gap:9px; justify-content:space-between;
      align-items:center; }
    code { font-size:11px; overflow-wrap:anywhere; text-align:start; color:var(--bodyColor,#777985); }
    .usage-kind { background:#f8e9ee; color:#86465e; padding:5px 9px; border-radius:99px; font-size:10px; }
    .usage-limit { display:grid; gap:4px; margin-top:16px; }
    .usage-limit small, .usage-numbers dt { font-size:11px; color:var(--bodyColor,#777985); }
    .usage-limit strong { font-size:21px; line-height:1.4; }
    .usage-numbers { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:16px 0 0; }
    .usage-numbers div { display:grid; gap:6px; }
    .usage-numbers dd { margin:0; font-size:16px; font-weight:700; overflow-wrap:anywhere; }
    .usage-period,.usage-unknown,.usage-info,.usage-disclaimer,.usage-warning {
      font-size:12px; line-height:1.9; color:var(--bodyColor,#777985); }
    .usage-period { margin:16px 0 0; }
    .usage-info { margin-top:18px; }
    .usage-disclaimer { border-top:1px solid var(--borderColor,#e6e5ed);
      margin:20px 0 0; padding-top:14px; }
    .usage-unknown { margin:14px 0 0; }
    .usage-warning,.usage-error { color:#aa3c3c; }
    .usage-error { font-size:12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
    @media(max-width:610px){ :host{padding:18px;} .usage-grid{grid-template-columns:1fr;} }
  `],
})
export class TenantUsageOverviewComponent implements OnInit {
  private readonly service = inject(TenantWorkspaceService);
  private readonly destroyRef = inject(DestroyRef);

  readonly usage = signal<TenantUsageProjection | null>(null);
  readonly loading = signal(false);
  readonly restricted = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void { this.load(); }

  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.restricted.set(false);
    this.error.set(null);
    this.service.getSubscriptionUsage()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.usage.set(data);
          this.loading.set(false);
        },
        error: (cause: HttpErrorResponse) => {
          this.usage.set(null);
          if (cause.status === 403) {
            this.restricted.set(true);
          } else {
            this.error.set('دریافت مصرف از سرور انجام نشد.');
          }
          this.loading.set(false);
        },
      });
  }

  /** Preserve bigint precision: no Number() conversion or floating-point math. */
  formatUnits(value: string | null): string {
    if (!value || !/^\d+$/.test(value)) return 'نامشخص';
    const grouped = value.replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
    const digits = '۰۱۲۳۴۵۶۷۸۹';
    return grouped.replace(/\d/g, digit => digits[Number(digit)]);
  }

  /** UTC instants rendered with Persian calendar; the actual period remains UTC. */
  formatPersianDate(value: string): string {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return 'نامشخص';
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(date);
  }

  stateMessage(state: TenantUsageMetric['state']): string {
    switch (state) {
      case 'DomainCountUnavailable':
        return 'شمارش موجودیت‌های فعال هنوز برای این Resource به موتور متصل نشده است.';
      case 'PeriodNotConfigured':
        return 'دوره مصرف این قابلیت هنوز در قرارداد فنی ماژول مشخص نشده است.';
      case 'PeriodUnavailable':
        return 'دوره جاری مصرف قابل محاسبه نیست.';
      case 'PeriodConflict':
        return 'دوره ثبت‌شده در پایگاه داده با اشتراک هماهنگ نیست و باید بررسی شود.';
      default:
        return 'تنظیمات این محدودیت نیاز به بررسی دارد.';
    }
  }
}
