import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import {
  TenantRolePermissionMatrix, TenantWorkspaceService,
} from './tenant-workspace.service';

@Component({
  selector: 'app-tenant-role-permissions',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  styleUrl: './tenant-workspace.styles.scss',
  template: `
    <section class="tenant-page">
      <div class="tenant-page-heading">
        <div>
          <p class="eyebrow">ROLE PERMISSIONS</p>
          <h1>مجوزهای نقش {{ matrix()?.roleName || '' }}</h1>
          <p>وضعیت ثبت در کاتالوگ و تخصیص مستقیم به نقش در مستأجر جاری.</p>
          <p>این فهرست تخصیص مستقیم نقش است، نه مجوز مؤثر کاربر. ویرایش فقط با مجوز تأییدشده امکان‌پذیر است.</p>
        </div>
        <div class="tenant-actions">
          <a routerLink="/dashboard/roles" mat-stroked-button>بازگشت به نقش‌ها</a>
          <button mat-stroked-button type="button" (click)="load()" [disabled]="loading()">
            به‌روزرسانی
          </button>
        </div>
      </div>
      @if (notice()) {
        <div class="tenant-feedback" role="status">{{ notice() }}</div>
      }
      @if (loading()) {
        <div class="tenant-feedback" role="status">در حال دریافت مجوزهای نقش...</div>
      } @else if (error()) {
        <div class="tenant-feedback error" role="alert">
          {{ error() }}
          <button mat-flat-button type="button" (click)="load()">تلاش مجدد</button>
        </div>
      } @else if (matrix(); as info) {
        <div class="tenant-panel tenant-role-permission-list">
          @if (info.canEdit && !editMode()) {
            <div class="tenant-permission-toolbar">
              <p>تغییر مجوزهای این نقش ثبت و ممیزی می‌شود.</p>
              <button mat-flat-button type="button" (click)="beginEdit()">ویرایش مجوزها</button>
            </div>
          } @else if (!info.canEdit) {
            <p class="notice">این نقش در حال حاضر فقط قابل مشاهده است.</p>
          }
          @for (permission of info.permissions; track permission.code) {
            <article class="tenant-role-permission-item">
              <div>
                <h2>{{ permission.name }}</h2>
                <small>{{ permission.code }} · {{ permission.kind }}</small>
              </div>
              @if (editMode() && info.canEdit && permission.registered) {
                <label class="tenant-permission-toggle">
                  <input type="checkbox" [checked]="isSelected(permission.code)"
                    (change)="toggle(permission.code, $any($event.target).checked)"
                    [disabled]="saving()" />
                  تخصیص به نقش
                </label>
              } @else {
                <span class="tenant-role-permission-state"
                  [class.denied]="permission.registered && !permission.granted"
                  [class.missing]="!permission.registered">
                  {{ !permission.registered ? 'ثبت‌نشده در کاتالوگ' :
                     permission.granted ? 'تخصیص مستقیم دارد' : 'تخصیص ندارد' }}
                </span>
              }
            </article>
          } @empty {
            <p class="notice">مجوزی برای این نقش تعریف نشده است.</p>
          }
          @if (editMode() && info.canEdit) {
            @if (saveError()) {
              <div class="tenant-feedback error" role="alert">{{ saveError() }}</div>
            }
            <div class="tenant-actions tenant-permission-actions">
              <button mat-flat-button type="button" (click)="save()"
                [disabled]="saving() || !hasChanges()">
                {{ saving() ? 'در حال ذخیره...' : 'ذخیره تغییرات' }}
              </button>
              <button mat-stroked-button type="button" (click)="cancelEdit()"
                [disabled]="saving()">انصراف</button>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class TenantRolePermissionsComponent implements OnInit {
  private readonly api = inject(TenantWorkspaceService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly matrix = signal<TenantRolePermissionMatrix | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly editMode = signal(false);
  readonly selected = signal<ReadonlySet<string>>(new Set<string>());
  readonly saveError = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  ngOnInit(): void { this.load(); }

  load(): void {
    if (this.loading() || this.saving()) return;
    this.editMode.set(false);
    this.selected.set(new Set());
    this.saveError.set(null);
    this.error.set(null);
    this.matrix.set(null);
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      this.error.set('شناسه نقش معتبر نیست.');
      return;
    }
    this.loading.set(true);
    this.api.getRolePermissions(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        if (!result || result.roleId.toLowerCase() !== id.toLowerCase() ||
          !Array.isArray(result.permissions)) {
          this.error.set('پاسخ مجوزهای نقش معتبر نیست.');
        } else {
          this.matrix.set(result);
        }
        this.loading.set(false);
      },
      error: (err: { status?: number }) => {
        this.error.set(err?.status === 403
          ? 'برای مشاهده مجوزهای این نقش دسترسی لازم را ندارید.'
          : err?.status === 404
            ? 'این نقش در فضای کاری فعلی پیدا نشد.'
            : 'دریافت مجوزهای نقش ناموفق بود.');
        this.loading.set(false);
      },
    });
  }
  beginEdit(): void {
    const value = this.matrix();
    if (!value?.canEdit || !value.version || this.loading() || this.saving() ||
        value.permissions.some(x => !x.registered)) return;
    this.selected.set(new Set(value.permissions.filter(x => x.granted).map(x => x.code)));
    this.saveError.set(null);
    this.notice.set(null);
    this.editMode.set(true);
  }

  isSelected(code: string): boolean { return this.selected().has(code); }

  toggle(code: string, checked: boolean): void {
    const value = this.matrix();
    if (!this.editMode() || !value?.canEdit || this.saving() ||
        !value.permissions.some(x => x.code === code && x.registered)) return;
    const next = new Set(this.selected());
    if (checked) next.add(code); else next.delete(code);
    this.selected.set(next);
  }

  hasChanges(): boolean {
    const value = this.matrix();
    return !!value?.canEdit && this.editMode() &&
      value.permissions.some(x => x.granted !== this.isSelected(x.code));
  }

  cancelEdit(): void {
    if (this.saving()) return;
    this.editMode.set(false);
    this.saveError.set(null);
    this.selected.set(new Set());
  }

  save(): void {
    const value = this.matrix();
    const id = this.route.snapshot.paramMap.get('id');
    if (!value?.canEdit || !value.version || !id || !this.editMode() ||
        !this.hasChanges() || this.saving()) return;
    this.saving.set(true);
    this.saveError.set(null);
    const codes = value.permissions.filter(x => x.registered && this.isSelected(x.code))
      .map(x => x.code);
    this.api.replaceRolePermissions(id, value.version, codes)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.saving.set(false);
          this.cancelEdit();
          this.notice.set('مجوزهای نقش با موفقیت ذخیره شدند.');
          this.load();
        },
        error: (err: { status?: number }) => {
          this.saving.set(false);
          if (err?.status === 403 || err?.status === 404) {
            this.cancelEdit();
            this.matrix.set(null);
            this.error.set(err.status === 403
              ? 'مجوز مدیریت این نقش لغو شده است.'
              : 'این نقش دیگر قابل دسترسی نیست.');
          } else if (err?.status === 409) {
            this.cancelEdit();
            this.notice.set('نسخه نقش تغییر کرده است. داده‌ها مجدد دریافت شدند؛ تغییرات را دوباره بررسی کنید.');
            this.load();
          } else {
            this.saveError.set(err?.status === 400
              ? 'درخواست تخصیص مجوز معتبر نیست.'
              : 'ذخیره مجوزها انجام نشد. دوباره تلاش کنید.');
          }
        },
      });
  }

}
