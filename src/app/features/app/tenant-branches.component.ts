import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TenantWorkspaceBranch, TenantWorkspaceService } from './tenant-workspace.service';

@Component({
  selector: 'app-tenant-branches',
  standalone: true,
  imports: [MatButtonModule],
  styleUrl: './tenant-workspace.styles.scss',
  template: `
    <section class="tenant-page">
      <div class="tenant-page-heading">
        <div>
          <p class="eyebrow">BRANCHES</p>
          <h1>شعبه‌های فضای کاری</h1>
          <p>فقط شعبه‌های متعلق به فضای کاری فعلی قابل مشاهده هستند.</p>
        </div>
        <button mat-stroked-button (click)="load()" [disabled]="loading()">به‌روزرسانی</button>
      </div>
      @if (loading()) {
        <div class="tenant-feedback" role="status">در حال دریافت شعبه‌ها...</div>
      } @else if (error()) {
        <div class="tenant-feedback error" role="alert">
          {{ error() }}
          <button mat-flat-button (click)="load()">تلاش مجدد</button>
        </div>
      } @else if (branches(); as list) {
        @if (list.length === 0) {
          <div class="tenant-feedback" role="status">شعبه‌ای برای این فضای کاری ثبت نشده است.</div>
        } @else {
          <div class="tenant-branch-grid">
            @for (branch of list; track branch.id) {
              <article class="tenant-card branch-card">
                <span class="material-symbols-outlined" aria-hidden="true">store</span>
                <div class="branch-title">
                  <h2>{{ branch.name }}</h2>
                  @if (branch.isMain) { <span class="tenant-tag">شعبه اصلی</span> }
                </div>
                <dl class="tenant-details">
                  <div><dt>شهر</dt><dd>{{ branch.city || '—' }}</dd></div>
                  <div><dt>آدرس</dt><dd>{{ branch.address || '—' }}</dd></div>
                  <div><dt>شماره تماس</dt><dd>{{ branch.phone || '—' }}</dd></div>
                </dl>
              </article>
            }
          </div>
        }
      }
    </section>
  `,
})
export class TenantBranchesComponent implements OnInit {
  private readonly api = inject(TenantWorkspaceService);
  private readonly destroyRef = inject(DestroyRef);
  readonly branches = signal<TenantWorkspaceBranch[] | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void { this.load(); }

  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.branches.set(null);
    this.api.getBranches().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        if (Array.isArray(data)) this.branches.set(data);
        else this.error.set('پاسخ فهرست شعبه‌ها نامعتبر است.');
        this.loading.set(false);
      },
      error: () => {
        this.error.set('دریافت شعبه‌ها ناموفق بود. اتصال را بررسی کنید.');
        this.loading.set(false);
      },
    });
  }
}
