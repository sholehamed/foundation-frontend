import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  TenantDirectoryItem, TenantDirectoryKind, TenantDirectoryPage,
  TenantPendingMemberCreateRequest, TenantPendingMemberCreated,
  TenantMemberWithInitialPassword, TenantWorkspaceService,
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
      @if (inviteError()) {
        <div class="tenant-feedback error" role="alert">{{ inviteError() }}</div>
      }
      @if (temporaryError()) {
        <div class="tenant-feedback error" role="alert">{{ temporaryError() }}</div>
      }
      @if (temporarySecret(); as issued) {
        <section class="tenant-panel" role="dialog" aria-label="رمز اولیه یک‌بارنمایش" style="border:2px solid #a65d6d">
          <h2>رمز اولیه کارمند — فقط همین یک‌بار</h2>
          <p>این رمز برای ورود اولیه {{ issued.userName }} است و حداکثر ۶۰ دقیقه اعتبار دارد.
            آن را فقط پس از تأیید هویت، به کارمند تحویل دهید. پس از بستن، بازیابی آن ممکن نیست؛
            در صورت گم‌شدن باید رمز جدید صادر کنید.</p>
          <code dir="ltr" style="display:block;overflow-wrap:anywhere;font-size:17px;
            padding:14px;margin:12px 0;border-radius:9px;background:#f5eef2">{{ issued.password }}</code>
          <button mat-flat-button type="button" (click)="closeTemporarySecret()">
            تحویل دادم؛ بستن و پاک‌کردن رمز
          </button>
        </section>
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
              <mat-label>ایمیل (اختیاری، فقط برای دعوت ایمیلی)</mat-label>
              <input matInput name="email" type="email" maxlength="256"
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
            @if (canIssueTemporaryPassword()) {
              <label style="display:flex;align-items:center;gap:9px;grid-column:1 / -1;margin-bottom:12px">
                <input type="checkbox" [checked]="issuePasswordOnCreate()"
                  (change)="issuePasswordOnCreate.set($any($event.target).checked)"
                  [disabled]="saving()" />
                صدور رمز اولیه هنگام ثبت؛ فقط یک‌بار نمایش داده می‌شود و کارمند هنگام ورود
                باید رمز خودش را تعیین کند
              </label>
            }
            @if (saveError()) { <p role="alert">{{ saveError() }}</p> }
            <div class="tenant-heading-actions">
              <button mat-flat-button type="submit"
                [disabled]="saving() || !createForm.valid">{{
                  canIssueTemporaryPassword() && issuePasswordOnCreate()
                    ? 'ثبت کارمند و صدور رمز اولیه' : 'ثبت حساب غیرفعال'
                }}</button>
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
                  @if (!item.isActive && canIssueTemporaryPassword()) {
                    <button mat-stroked-button type="button" (click)="issueTemporaryPassword(item.id, itemTitle(item))"
                      [disabled]="loading() || saving() || !!invitingMemberId() || !!issuingMemberId() || !!temporarySecret()">
                      {{ issuingMemberId() === item.id ? 'در حال صدور...' : 'صدور رمز اولیه' }}
                    </button>
                  }
                  @if (canInviteMember(item)) {
                    <button mat-flat-button type="button" (click)="inviteMember(item.id)"
                      [disabled]="loading() || saving() || !!invitingMemberId()">
                      {{ invitingMemberId() === item.id ? 'در حال ثبت ارسال...' : 'ارسال دعوت‌نامه' }}
                    </button>
                  }
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
  readonly canInviteMembers = signal(false);
  readonly canIssueTemporaryPassword = signal(false);
  readonly issuingMemberId = signal<string | null>(null);
  readonly temporaryError = signal<string | null>(null);
  readonly temporarySecret = signal<{ userName: string; password: string } | null>(null);
  readonly invitingMemberId = signal<string | null>(null);
  readonly inviteError = signal<string | null>(null);
  readonly createOpen = signal(false);
  readonly issuePasswordOnCreate = signal(true);
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
      this.canInviteMembers.set(false);
      this.canIssueTemporaryPassword.set(false);
      this.temporarySecret.set(null);
      this.createOpen.set(false);
      this.page.set(1);
      this.load();
    });
  }
  private refreshCreateAccess(): void {
    this.canCreateMembers.set(false);
    this.canInviteMembers.set(false);
    this.canIssueTemporaryPassword.set(false);
    this.api.getAdminCapabilities().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: value => {
        const allowed = value?.canViewMembers === true &&
          value?.canCreateMembers === true;
        this.canCreateMembers.set(allowed);
        this.canInviteMembers.set(value?.canViewMembers === true &&
          value?.canInviteMembers === true);
        this.canIssueTemporaryPassword.set(environment.tenantFirstLoginEnabled &&
          value?.canViewMembers === true && value?.canIssueTemporaryPassword === true);
        if (!allowed) this.createOpen.set(false);
      },
      error: () => {
        this.canCreateMembers.set(false);
        this.canInviteMembers.set(false);
        this.canIssueTemporaryPassword.set(false);
        this.createOpen.set(false);
      },
    });
  }

  closeTemporarySecret(): void {
    this.temporarySecret.set(null);
    // A one-time secret is never recoverable, even after a page refresh.
    // Reload only after the Owner explicitly closes the secret view.
    if (this.kind() === 'members' && !this.loading()) this.load();
  }

  issueTemporaryPassword(memberId: string, userName: string): void {
    if (!environment.tenantFirstLoginEnabled || this.kind() !== 'members' ||
        !this.canIssueTemporaryPassword() || this.saving() || this.loading() ||
        this.issuingMemberId() || this.invitingMemberId() || this.temporarySecret() ||
        !this.result()?.items.some(row => row.id === memberId &&
          !row.isActive)) return;

    this.temporaryError.set(null);
    this.issuingMemberId.set(memberId);
    this.api.getAdminCapabilities().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: cap => {
        if (cap?.canViewMembers !== true || cap?.canIssueTemporaryPassword !== true) {
          this.temporaryDenied();
          return;
        }
        this.api.issueTemporaryPassword(memberId)
          .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: response => {
              this.issuingMemberId.set(null);
              if (!response?.temporaryPassword || response.temporaryPassword.length < 24) {
                this.temporaryError.set('صدور رمز اولیه قابل تأیید نیست. در صورت لزوم رمز جدید صادر کنید.');
                return;
              }
              this.temporarySecret.set({ userName, password: response.temporaryPassword });
              this.notice.set(null);
            },
            error: (error: { status?: number }) => {
              this.issuingMemberId.set(null);
              if ([401, 403, 404].includes(error.status ?? 0)) {
                this.temporaryDenied();
                return;
              }
              this.temporaryError.set(error.status === 429
                ? 'درخواست‌های زیادی صادر شده؛ بعداً تلاش کنید.'
                : 'صدور رمز اولیه تأیید نشد. دوباره تلاش کنید.');
            },
          });
      },
      error: () => this.temporaryDenied(),
    });
  }

  private temporaryDenied(): void {
    this.issuingMemberId.set(null);
    this.canIssueTemporaryPassword.set(false);
    this.temporarySecret.set(null);
    this.result.set(null);
    this.temporaryError.set('مجوز صدور رمز اولیه معتبر نیست یا لغو شده است.');
  }

  inviteMember(memberId: string): void {
    if (this.kind() !== 'members' || !this.canInviteMembers() ||
        this.loading() || this.saving() || this.invitingMemberId() ||
        !this.result()?.items.some(row => row.id === memberId &&
          this.canInviteMember(row))) return;

    this.inviteError.set(null);
    this.notice.set(null);
    this.invitingMemberId.set(memberId);
    // UI is advisory: server repeats every live Owner, Tenant and ACTION
    // check inside the SQL transaction; never accept an arbitrary target.
    this.api.getAdminCapabilities().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: cap => {
        if (cap?.canViewMembers !== true || cap?.canInviteMembers !== true) {
          this.inviteDenied();
          return;
        }
        this.api.invitePendingMember(memberId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: receipt => {
            this.invitingMemberId.set(null);
            if (receipt?.status !== 'submitted') {
              this.inviteError.set('پاسخ سرویس ارسال معتبر نیست. وضعیت را بررسی کنید.');
              return;
            }
            this.notice.set('دعوت‌نامه به سرویس ایمیل تحویل شد؛ دریافت آن در صندوق ایمیل تأیید نشده است.');
          },
          error: (err: { status?: number }) => {
            this.invitingMemberId.set(null);
            if (err.status === 401 || err.status === 403 || err.status === 404) {
              this.inviteDenied();
              return;
            }
            this.inviteError.set(err.status === 429
              ? 'تعداد درخواست‌های ارسال دعوت بیش از حد مجاز است.'
              : err.status === 503 ? 'سرویس ایمیل دعوت‌نامه آماده نیست. ارسال تأیید نشد.'
                : 'دعوت‌نامه ارسال نشد. وضعیت حساب و سرویس را بررسی کنید.');
          },
        });
      },
      error: () => this.inviteDenied(),
    });
  }

  private inviteDenied(): void {
    this.invitingMemberId.set(null);
    this.canInviteMembers.set(false);
    this.result.set(null);
    this.inviteError.set('دسترسی دعوت این کارمند نامعتبر است یا لغو شده است.');
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
      email: this.email().trim() || null,
      firstName: this.firstName().trim(),
      lastName: this.lastName().trim(),
    };
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._+-]{2,99}$/.test(request.userName) ||
        (request.email !== null && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)) ||
        !request.firstName || request.firstName.length > 80 ||
        !request.lastName || request.lastName.length > 80) {
      this.saveError.set('نام کاربری، ایمیل واردشده و مشخصات عضو را بررسی کنید.');
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
        const withInitial = environment.tenantFirstLoginEnabled &&
          this.issuePasswordOnCreate() && this.canIssueTemporaryPassword();
        if (withInitial && cap?.canIssueTemporaryPassword !== true) {
          this.saving.set(false);
          this.canIssueTemporaryPassword.set(false);
          this.saveError.set('مجوز صدور رمز اولیه لغو شده است. برای ثبت مجدد تلاش کنید.');
          return;
        }
        const operation: Observable<TenantPendingMemberCreated | TenantMemberWithInitialPassword> =
          withInitial ? this.api.createMemberWithInitialPassword(request)
            : this.api.createPendingMember(request);
        operation.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: payload => {
            this.saving.set(false);
            const result = 'member' in payload ? payload.member : payload;
            const issued = 'temporaryPassword' in payload
              ? payload.temporaryPassword : null;
            if (!result?.id || result.isActive !== false ||
                (withInitial && (!issued || issued.length < 24))) {
              this.canCreateMembers.set(false);
              this.createOpen.set(false);
              this.saveError.set('پاسخ ثبت عضو قابل تأیید نیست؛ وضعیت حساب را بررسی کنید.');
              return;
            }
            this.createOpen.set(false);
            this.userName.set('');
            this.email.set('');
            this.firstName.set('');
            this.lastName.set('');
            this.page.set(1);
            if (issued) {
              this.temporarySecret.set({ userName: result.userName, password: issued });
              this.notice.set(null);
              // Do not trigger list reload while the one-time secret is shown.
            } else {
              this.notice.set('حساب غیرفعال ایجاد شد؛ هنوز دعوت‌نامه یا دسترسی ورود ندارد.');
              this.load();
            }
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
  canInviteMember(item: TenantDirectoryItem): boolean {
    return 'email' in item && !item.isActive &&
      typeof item.email === 'string' && item.email.trim().length > 0 &&
      this.canInviteMembers();
  }
  itemDescription(item: TenantDirectoryItem): string {
    return 'userName' in item
      ? item.userName + ' · ' + (item.email || 'بدون ایمیل · فعال‌سازی حضوری') : item.description || 'بدون توضیحات';
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
    if (this.loading() || this.saving() || this.invitingMemberId() ||
        this.issuingMemberId() || this.temporarySecret()) return;
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
