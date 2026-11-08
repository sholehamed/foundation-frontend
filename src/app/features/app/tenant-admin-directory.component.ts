import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { Observable } from 'rxjs';
import {
  TenantDirectoryItem, TenantDirectoryKind, TenantDirectoryPage, TenantWorkspaceService,
} from './tenant-workspace.service';

@Component({
  selector: 'app-tenant-admin-directory',
  standalone: true,
  imports: [MatButtonModule],
  styleUrl: './tenant-workspace.styles.scss',
  template: `
    <section class="tenant-page">
      <div class="tenant-page-heading">
        <div>
          <p class="eyebrow">TENANT ADMIN</p>
          <h1>{{ title() }}</h1>
          <p>این فهرست فقط متعلق به فضای کاری فعلی است و فعلاً امکان ویرایش ندارد.</p>
        </div>
        <button mat-stroked-button type="button" (click)="load()" [disabled]="loading()">به‌روزرسانی</button>
      </div>
      @if (loading()) {
        <div class="tenant-feedback" role="status">در حال دریافت اطلاعات...</div>
      } @else if (error()) {
        <div class="tenant-feedback error" role="alert">
          {{ error() }}
          <button mat-flat-button type="button" (click)="load()">تلاش مجدد</button>
        </div>
      } @else if (result(); as data) {
        <div class="tenant-panel tenant-directory-panel">
          @if (data.items.length === 0) {
            <p class="notice">اطلاعاتی برای نمایش وجود ندارد.</p>
          } @else {
            @for (item of data.items; track item.id) {
              <article class="tenant-directory-item">
                <span class="material-symbols-outlined" aria-hidden="true">
                  {{ kind() === 'members' ? 'person' : kind() === 'roles' ? 'verified_user' : 'groups' }}
                </span>
                <div class="tenant-directory-detail">
                  <h2>{{ itemTitle(item) }}</h2>
                  <p>{{ itemDescription(item) }}</p>
                </div>
                <span class="tenant-tag" [class.tenant-tag-inactive]="!item.isActive">
                  {{ item.isActive ? 'فعال' : 'غیرفعال' }}
                </span>
              </article>
            }
          }
          <div class="tenant-pagination">
            <span>صفحه {{ data.page }}</span>
            <button mat-stroked-button type="button" (click)="previous()"
              [disabled]="loading() || page() === 1">قبلی</button>
            <button mat-flat-button type="button" (click)="next()"
              [disabled]="loading() || !data.hasNext">بعدی</button>
          </div>
        </div>
      }
    </section>
  `,
})
export class TenantAdminDirectoryComponent implements OnInit {
  private readonly api = inject(TenantWorkspaceService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly kind = signal<TenantDirectoryKind>('members');
  readonly result = signal<TenantDirectoryPage<TenantDirectoryItem> | null>(null);
  readonly page = signal(1);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
      const kind: unknown = data['directoryKind'];
      if (kind !== 'members' && kind !== 'roles' && kind !== 'groups') {
        this.error.set('نوع صفحه مشخص نیست.');
        return;
      }
      this.kind.set(kind);
      this.page.set(1);
      this.load();
    });
  }
  title(): string {
    switch (this.kind()) {
      case 'members': return 'اعضای فضای کاری';
      case 'roles': return 'نقش‌های فضای کاری';
      case 'groups': return 'گروه‌های فضای کاری';
    }
  }
  itemTitle(item: TenantDirectoryItem): string {
    return 'userName' in item
      ? [item.firstName, item.lastName].filter(Boolean).join(' ') || item.userName
      : item.name;
  }
  itemDescription(item: TenantDirectoryItem): string {
    return 'userName' in item
      ? item.userName + ' · ' + item.email : item.description || 'بدون توضیحات';
  }
  previous(): void {
    if (!this.loading() && this.page() > 1) {
      this.page.update(v => v - 1);
      this.load();
    }
  }
  next(): void {
    if (!this.loading() && this.result()?.hasNext) {
      this.page.update(v => v + 1);
      this.load();
    }
  }
  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);
    const page = this.page();
    let request: Observable<TenantDirectoryPage<TenantDirectoryItem>>;
    switch (this.kind()) {
      case 'members': request = this.api.getMembers(page); break;
      case 'roles': request = this.api.getRoles(page); break;
      case 'groups': request = this.api.getGroups(page); break;
    }
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: value => {
        if (!value || !Array.isArray(value.items) || value.page !== page ||
            typeof value.hasNext !== 'boolean') {
          this.error.set('پاسخ سرویس معتبر نیست.');
        } else {
          this.result.set(value);
        }
        this.loading.set(false);
      },
      error: (e: { status?: number }) => {
        this.error.set(e?.status === 403
          ? 'برای مشاهده این بخش مجوز معتبر فضای کاری لازم است.'
          : 'دریافت اطلاعات ناموفق بود. دوباره تلاش کنید.');
        this.loading.set(false);
      },
    });
  }
}
