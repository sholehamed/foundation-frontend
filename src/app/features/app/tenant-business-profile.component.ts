import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TenantWorkspaceService, TenantWorkspaceSummary } from './tenant-workspace.service';

@Component({
  selector: 'app-tenant-business-profile',
  standalone: true,
  imports: [MatButtonModule],
  styleUrl: './tenant-workspace.styles.scss',
  template: `
    <section class="tenant-page">
      <div class="tenant-page-heading">
        <div>
          <p class="eyebrow">BUSINESS PROFILE</p>
          <h1>اطلاعات کسب‌وکار</h1>
          <p>اطلاعات ثبت‌شده هنگام ایجاد فضای کاری؛ این صفحه فعلاً فقط‌خواندنی است.</p>
        </div>
        <button mat-stroked-button (click)="load()" [disabled]="loading()">به‌روزرسانی</button>
      </div>
      @if (loading()) {
        <div class="tenant-feedback" role="status">در حال دریافت اطلاعات کسب‌وکار...</div>
      } @else if (error()) {
        <div class="tenant-feedback error" role="alert">{{ error() }}
          <button mat-flat-button (click)="load()">تلاش مجدد</button>
        </div>
      } @else if (workspace(); as data) {
        <article class="tenant-panel">
          <h2>{{ data.profile?.displayName || data.tenant.name }}</h2>
          @if (!data.profile) {
            <p class="notice">برای این فضای کاری هنوز پروفایل کسب‌وکار ثبت نشده است.</p>
          }
          <dl class="tenant-details">
            <div><dt>نام فضای کاری</dt><dd>{{ data.tenant.name }}</dd></div>
            <div><dt>شناسه فضای کاری</dt><dd>{{ data.tenant.slug }}</dd></div>
            <div><dt>نوع فعالیت</dt><dd>{{ data.profile?.activityType || '—' }}</dd></div>
            <div><dt>شهر</dt><dd>{{ data.profile?.city || '—' }}</dd></div>
            <div><dt>نشانی</dt><dd>{{ data.profile?.address || '—' }}</dd></div>
            <div><dt>پلن درخواستی</dt><dd>{{ data.profile?.requestedPlanKey || '—' }}</dd></div>
            <div><dt>دوره پرداخت درخواستی</dt><dd>{{ data.profile?.requestedBillingCycle || '—' }}</dd></div>
          </dl>
          <p class="notice">این اطلاعات نشان‌دهنده اشتراک فعال یا پرداخت تأییدشده نیست.</p>
        </article>
      }
    </section>
  `,
})
export class TenantBusinessProfileComponent implements OnInit {
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
      next: value => {
        if (value?.tenant) this.workspace.set(value);
        else this.error.set('اطلاعات کسب‌وکار معتبر نیست.');
        this.loading.set(false);
      },
      error: () => {
        this.error.set('دریافت اطلاعات کسب‌وکار انجام نشد.');
        this.loading.set(false);
      },
    });
  }
}
