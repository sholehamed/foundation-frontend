import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import {
  TenantMemberRoleItem, TenantMemberRolesMatrix, TenantWorkspaceService,
} from './tenant-workspace.service';

@Component({
  selector: 'app-tenant-member-roles',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  templateUrl: './tenant-member-roles.component.html',
  styleUrl: './tenant-workspace.styles.scss',
})
export class TenantMemberRolesComponent implements OnInit {
  private readonly api = inject(TenantWorkspaceService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly matrix = signal<TenantMemberRolesMatrix | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly editMode = signal(false);
  readonly selected = signal<ReadonlySet<string>>(new Set<string>());
  readonly error = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  ngOnInit(): void { this.load(); }

  private memberId(): string | null {
    const id = this.route.snapshot.paramMap.get('id');
    return id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      ? id : null;
  }

  load(): void {
    if (this.loading() || this.saving()) return;
    this.error.set(null);
    this.saveError.set(null);
    this.matrix.set(null);
    this.editMode.set(false);
    this.selected.set(new Set());
    const id = this.memberId();
    if (!id) {
      this.error.set('شناسه عضو معتبر نیست.');
      return;
    }
    this.loading.set(true);
    this.api.getMemberRoles(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        if (!result || result.userId?.toLowerCase() !== id.toLowerCase() ||
            !Array.isArray(result.roles)) {
          this.error.set('پاسخ نقش‌های عضو معتبر نیست.');
        } else {
          this.matrix.set(result);
        }
        this.loading.set(false);
      },
      error: (err: { status?: number }) => {
        this.error.set(err?.status === 403
          ? 'برای مشاهده نقش‌های این عضو دسترسی لازم را ندارید.'
          : err?.status === 404 ? 'این عضو در فضای کاری فعلی پیدا نشد.'
            : 'دریافت نقش‌های عضو ناموفق بود.');
        this.loading.set(false);
      },
    });
  }

  beginEdit(): void {
    const value = this.matrix();
    if (!value?.canEdit || !value.version || this.loading() || this.saving()) return;
    this.selected.set(new Set(value.roles.filter(x => x.assigned).map(x => x.id)));
    this.saveError.set(null);
    this.notice.set(null);
    this.editMode.set(true);
  }

  isSelected(id: string): boolean { return this.selected().has(id); }

  toggle(role: TenantMemberRoleItem, checked: boolean): void {
    const value = this.matrix();
    if (!this.editMode() || !value?.canEdit || this.saving() ||
        !value.roles.some(x => x.id === role.id) ||
        (checked && !role.isActive && !this.isSelected(role.id))) return;
    const next = new Set(this.selected());
    if (checked) next.add(role.id); else next.delete(role.id);
    this.selected.set(next);
  }

  hasChanges(): boolean {
    const value = this.matrix();
    return !!value?.canEdit && this.editMode() &&
      value.roles.some(x => x.assigned !== this.isSelected(x.id));
  }

  cancelEdit(): void {
    if (this.saving()) return;
    this.editMode.set(false);
    this.saveError.set(null);
    this.selected.set(new Set());
  }

  save(): void {
    const value = this.matrix();
    const id = this.memberId();
    if (!value?.canEdit || !value.version || !id || !this.editMode() ||
        !this.hasChanges() || this.saving()) return;
    this.saving.set(true);
    this.saveError.set(null);
    const roleIds = value.roles.filter(x => this.isSelected(x.id)).map(x => x.id);
    this.api.replaceMemberRoles(id, value.version, roleIds)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.saving.set(false);
          this.cancelEdit();
          this.notice.set('تخصیص نقش‌های عضو با موفقیت ثبت شد.');
          this.load();
        },
        error: (err: { status?: number }) => {
          this.saving.set(false);
          if (err?.status === 403 || err?.status === 404) {
            this.cancelEdit();
            this.matrix.set(null);
            this.error.set(err.status === 403
              ? 'مجوز مدیریت نقش‌های این عضو لغو شده است.'
              : 'عضو موردنظر دیگر قابل دسترسی نیست.');
          } else if (err?.status === 409) {
            this.cancelEdit();
            this.notice.set('نقش‌های عضو تغییر کرده‌اند؛ داده تازه دریافت شد. تغییرات را دوباره بررسی کنید.');
            this.load();
          } else {
            this.saveError.set(err?.status === 400
              ? 'شناسه نقش‌ها یا نسخه کاربر معتبر نیست.'
              : 'ذخیره نقش‌های عضو انجام نشد. دوباره تلاش کنید.');
          }
        },
      });
  }
}
