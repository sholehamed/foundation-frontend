import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  TenantDirectoryItem, TenantDirectoryKind, TenantDirectoryPage,
  TenantPendingMemberCreateRequest, TenantWorkspaceService,
} from './tenant-workspace.service';

@Component({
  selector: 'app-tenant-admin-directory',
  standalone: true,
  imports: [MatButtonModule, RouterLink, FormsModule, MatFormFieldModule, MatInputModule],
  styleUrl: './tenant-workspace.styles.scss',
  template: `
    <section class="tenant-page">
      <div class="tenant-page-heading">
        <div>
          <p class="eyebrow">TENANT ADMIN</p>
          <h1>{{ title() }}</h1>
          <p>این فهرست فقط متعلق به فضای کاری فعلی است؛ مدیریت نقش هر عضو در صفحه اختصاصی انجام می‌شود.</p>
        </div>
        <div class="tenant-heading-actions">
          @if (kind() === 'members' && canCreateMembers()) {
            <button mat-flat-button type="button" (click)="openCreate()"
              [disabled]="loading() || saving()">ثبت عضو غیرفعال</button>
          }
          <button mat-stroked-button type="button" (click)="load()" [disabled]="loading() || saving()">به‌روزرسانی</button>
        </div>
      </div>
      @if (notice()) {
        <div class="tenant-feedback" role="status">{{ notice() }}</div>
      }
      @if (kind() === 'members' && createOpen() && canCreateMembers()) {
        <section class="tenant-panel" aria-label="ثبت عضو غیرفعال">
          <h2>افزودن عضو بدون دسترسی ورود</h2>
          <p>حساب کارمند غیرفعال ساخته می‌شود. هنوز هیچ دعوت‌نامه، رمز عبور یا نقشی برای او صادر نمی‌شود.</p>
          <form class="tenant-member-create-form" (ngSubmit)="create()" #createForm="ngForm">
            <mat-form-field appearance="outline">
              <mat-label>نام کاربری</mat-label>
              <input matInput name="userName" required minlength="3" maxlength="100"
                [ngModel]="userName()" (ngModelChange)="userName.set($event)"
                autocomplete="off" [disabled]="saving()" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>ایمیل</mat-label>
              <input matInput name="email" type="email" required maxlength="256"
                [ngModel]="email()" (ngModelChange)="email.set($event)"
                autocomplete="off" [disabled]="saving()" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>نام</mat-label>
              <input matInput name="firstName" required maxlength="80"
                [ngModel]="firstName()" (ngModelChange)="firstName.set($event)"
                [disabled]="saving()" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>نام خانوادگی</mat-label>
              <input matInput name="lastName" required maxlength="80"
                [ngModel]="lastName()" (ngModelChange)="lastName.set($event)"
                [disabled]="saving()" />
            </mat-form-field>
            @if (saveError()) { <p role="alert">{{ saveError() }}</p> }
            <div class="tenant-heading-actions">
              <button mat-flat-button type="submit"
                [disabled]="saving() || !createForm.valid">ثبت حساب غیرفعال</button>
              <button mat-stroked-button type="button" [disabled]="saving()"
                (click)="closeCreate()">انصراف</button>
            </div>
          </form>
        </section>
      }
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
                @if (kind() === 'members') {
                  <a mat-stroked-button [routerLink]="['/dashboard/members', item.id, 'roles']">
                    نقش‌های عضو
                  </a>
                }
                @if (kind() === 'roles') {
                  <a mat-stroked-button [routerLink]="['/dashboard/roles', item.id, 'permissions']">
                    مشاهده مجوزها
                  </a>
                }
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
  readonly canCreateMembers = signal(false);
  readonly createOpen = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly userName = signal('');
  readonly email = signal('');
  readonly firstName = signal('');
  readonly lastName = signal('');

  ngOnInit(): void {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
      const kind: unknown = data['directoryKind'];
      if (kind !== 'members' && kind !== 'roles' && kind !== 'groups') {
        this.error.set('نوع صفحه مشخص نیست.');
        return;
      }
      this.kind.set(kind);
      this.canCreateMembers.set(false);
      this.createOpen.set(false);
      this.page.set(1);
      this.load();
    });
  }
  private refreshCreateAccess(): void {
    this.canCreateMembers.set(false);
    this.api.getAdminCapabilities().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: value => {
        const allowed = value?.canViewMembers === true &&
          value?.canCreateMembers === true;
        this.canCreateMembers.set(allowed);
        if (!allowed) this.createOpen.set(false);
      },
      error: () => {
        this.canCreateMembers.set(false);
        this.createOpen.set(false);
      },
    });
  }

  openCreate(): void {
    if (!this.canCreateMembers() || this.loading() || this.saving()) return;
    this.createOpen.set(true);
    this.saveError.set(null);
    this.notice.set(null);
  }

  closeCreate(): void {
    if (this.saving()) return;
    this.createOpen.set(false);
    this.saveError.set(null);
  }

  create(): void {
    if (this.kind() !== 'members' || !this.createOpen() ||
        !this.canCreateMembers() || this.saving()) return;
    const request: TenantPendingMemberCreateRequest = {
      userName: this.userName().trim(),
      email: this.email().trim(),
      firstName: this.firstName().trim(),
      lastName: this.lastName().trim(),
    };
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._+-]{2,99}$/.test(request.userName) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email) ||
        !request.firstName || request.firstName.length > 80 ||
        !request.lastName || request.lastName.length > 80) {
      this.saveError.set('نام کاربری، ایمیل و مشخصات عضو را بررسی کنید.');
      return;
    }
    this.saving.set(true);
    this.saveError.set(null);
    // Re-check immediately before write. Backend still independently
    // validates local Owner, registered ACTION and live scoped grants.
    this.api.getAdminCapabilities().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: cap => {
        if (cap?.canViewMembers !== true || cap?.canCreateMembers !== true) {
          this.creationDenied();
          return;
        }
        this.api.createPendingMember(request).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: created => {
            this.saving.set(false);
            if (!created?.id || created.isActive !== false) {
              this.canCreateMembers.set(false);
              this.createOpen.set(false);
              this.saveError.set('پاسخ سرور قابل تأیید نیست؛ اطلاعات را دوباره بررسی کنید.');
              return;
            }
            this.createOpen.set(false);
            this.userName.set('');
            this.email.set('');
            this.firstName.set('');
            this.lastName.set('');
            this.notice.set('حساب غیرفعال ایجاد شد؛ هنوز دعوت‌نامه یا دسترسی ورود ندارد.');
            this.page.set(1);
            this.load();
          },
          error: (e: { status?: number }) => {
            this.saving.set(false);
            if (e?.status === 401 || e?.status === 403 || e?.status === 404) {
              this.creationDenied();
              return;
            }
            this.saveError.set(e?.status === 409
              ? 'نام کاربری یا ایمیل از قبل در همین فضای کاری ثبت شده است.'
              : e?.status === 429 ? 'تعداد درخواست‌ها زیاد است؛ بعداً دوباره تلاش کنید.'
                : e?.status === 400 ? 'اطلاعات عضو معتبر نیست.'
                  : 'ایجاد عضو انجام نشد. وضعیت را بررسی و دوباره تلاش کنید.');
          },
        });
      },
      error: () => this.creationDenied(),
    });
  }

  private creationDenied(): void {
    this.saving.set(false);
    this.createOpen.set(false);
    this.canCreateMembers.set(false);
    this.result.set(null);
    this.error.set('دسترسی ایجاد عضو معتبر نیست یا لغو شده است؛ صفحه را به‌روزرسانی کنید.');
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
    if (this.loading() || this.saving()) return;
    if (this.kind() === 'members') this.refreshCreateAccess();
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
