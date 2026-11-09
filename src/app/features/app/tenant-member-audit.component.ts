import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import {
  TenantMemberAuditEntry, TenantMemberAuditPage, TenantWorkspaceService,
} from './tenant-workspace.service';

/**
 * Read-only security events. Never render a temporary password, invitation
 * token, hash, email or session value. The backend enforces local Owner rights
 * and tenant-bound, parameterized SQL independently of the navigation guard.
 */
@Component({
  selector: 'app-tenant-member-audit',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  styleUrl: './tenant-workspace.styles.scss',
  template: `
    <section class="tenant-page" dir="rtl">
      <div class="tenant-page-heading">
        <div>
          <p class="eyebrow">TENANT ADMIN · AUDIT</p>
          <h1>تاریخچه امنیتی اعضا</h1>
          <p>رویدادهای ثبت عضو، رمز اولیه، فعال‌سازی و تغییر نقش‌ها، بدون نمایش اطلاعات محرمانه.</p>
        </div>
        <div class="tenant-heading-actions">
          <a mat-stroked-button routerLink="/dashboard/members">بازگشت به اعضا</a>
          <button mat-flat-button type="button" (click)="load()" [disabled]="loading()">
            به‌روزرسانی
          </button>
        </div>
      </div>
      @if (memberId()) {
        <div class="tenant-panel">
          <span>فقط رویدادهای عضو انتخاب‌شده</span>
          <a mat-stroked-button routerLink="/dashboard/member-audit">
            مشاهده همه رویدادها
          </a>
        </div>
      }
      @if (loading()) {
        <p role="status">در حال دریافت تاریخچه...</p>
      } @else if (error()) {
        <section class="tenant-feedback error" role="alert">
          <p>{{ error() }}</p>
          @if (canRetry()) {
            <button mat-stroked-button type="button" (click)="load()">تلاش دوباره</button>
          }
        </section>
      } @else if (audit(); as data) {
        <section class="tenant-panel" aria-label="رویدادهای امنیتی">
          @if (data.items.length === 0) {
            <p>رویدادی برای این فیلتر ثبت نشده است.</p>
          } @else {
            <div class="audit-list">
              @for (event of data.items; track event.id) {
                <article class="audit-item">
                  <div>
                    <strong>{{ actionLabel(event) }}</strong>
                    @if (event.category === 'member_role' && event.roleName) {
                      <span> — {{ event.roleName }}</span>
                    }
                    <p>
                      انجام‌دهنده: {{ event.actorUserName || event.actorUserId }}
                      · عضو: {{ event.targetUserName || event.targetUserId }}
                    </p>
                  </div>
                  <time [attr.datetime]="event.occurredAtUtc">
                    {{ formatOccurredAt(event.occurredAtUtc) }}
                  </time>
                </article>
              }
            </div>
          }
          <div class="tenant-pagination">
            <span>صفحه {{ data.pageNumber }}</span>
            <button mat-stroked-button type="button" (click)="previous()"
              [disabled]="loading() || page() === 1">قبلی</button>
            <button mat-flat-button type="button" (click)="next()"
              [disabled]="loading() || !data.hasNext">بعدی</button>
          </div>
        </section>
      }
    </section>
  `,
  styles: [`
    .audit-list { display: grid; gap: 12px; }
    .audit-item { padding: 14px 0; border-bottom: 1px solid #e6dfe5;
      display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }
    .audit-item:last-child { border-bottom: 0; }
    .audit-item strong { font-weight: 700; }
    .audit-item p { margin: 6px 0 0; font-size: 13px; line-height: 1.8; overflow-wrap: anywhere; }
    .audit-item time { white-space: nowrap; font-size: 13px; color: #756b78; }
    @media (max-width: 650px) { .audit-item { flex-direction: column; gap: 5px; } }
  `],
})
export class TenantMemberAuditComponent implements OnInit {
  private readonly api = inject(TenantWorkspaceService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly memberId = signal<string | null>(null);
  readonly audit = signal<TenantMemberAuditPage | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly canRetry = signal(true);
  readonly page = signal(1);

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const memberId = params.get('memberId');
        if (memberId && !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(memberId)) {
          this.audit.set(null);
          this.memberId.set(null);
          this.error.set('شناسه عضو معتبر نیست.');
          this.canRetry.set(false);
          return;
        }
        this.memberId.set(memberId);
        this.page.set(1);
        this.canRetry.set(true);
        this.load();
      });
  }

  load(): void {
    if (this.loading() || !this.canRetry()) return;
    this.loading.set(true);
    this.error.set(null);
    this.api.getMemberAudit(this.page(), this.memberId())
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: data => {
          this.loading.set(false);
          if (!data || !Array.isArray(data.items) ||
              data.pageNumber !== this.page() || typeof data.hasNext !== 'boolean') {
            this.audit.set(null);
            this.error.set('پاسخ سرویس تاریخچه معتبر نیست.');
            return;
          }
          this.audit.set(data);
        },
        error: (err: { status?: number }) => {
          this.loading.set(false);
          this.audit.set(null);
          if ([401, 403, 404].includes(err.status ?? 0)) {
            this.canRetry.set(false);
            this.error.set('مجوز مشاهده تاریخچه امنیتی معتبر نیست یا لغو شده است.');
          } else {
            this.error.set('دریافت تاریخچه ناموفق بود. دوباره تلاش کنید.');
          }
        },
      });
  }

  next(): void {
    if (this.loading() || !this.audit()?.hasNext || this.page() >= 1000) return;
    this.page.update(value => value + 1);
    this.load();
  }

  previous(): void {
    if (this.loading() || this.page() <= 1) return;
    this.page.update(value => value - 1);
    this.load();
  }

  actionLabel(item: TenantMemberAuditEntry): string {
    if (item.category === 'member_role') {
      return item.action === 'grant' ? 'نقش اعطا شد'
        : item.action === 'revoke' ? 'نقش لغو شد' : 'تغییر نقش عضو';
    }
    const labels: Record<string, string> = {
      create_inactive: 'حساب غیرفعال ایجاد شد',
      temp_issued: 'رمز اولیه صادر شد',
      password_changed: 'رمز عبور تغییر کرد',
      invite_issued: 'دعوت‌نامه صادر شد',
      invite_submitted: 'دعوت‌نامه به سرویس ارسال تحویل شد',
      invite_failed: 'ارسال دعوت‌نامه ناموفق بود',
      invite_activated: 'حساب با دعوت‌نامه فعال شد',
    };
    return labels[item.action] ?? 'رویداد عضو';
  }

  formatOccurredAt(utc: string): string {
    const date = new Date(utc);
    if (Number.isNaN(date.getTime())) return 'زمان نامشخص';
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      dateStyle: 'medium', timeStyle: 'short',
    }).format(date);
  }
}
