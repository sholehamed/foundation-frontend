import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import {
  TenantGroupRoleItem, TenantGroupRolesPage, TenantWorkspaceService,
} from './tenant-workspace.service';

/**
 * Separate role grants to one Group at a time, never a bulk role set update.
 * The server enforces Owner, self-membership denial, Tenant scope and SQL CAS.
 */
@Component({
  selector: 'app-tenant-group-roles',
  standalone: true,
  imports: [MatButtonModule, RouterLink],
  templateUrl: './tenant-group-roles.component.html',
  styleUrl: './tenant-workspace.styles.scss',
})
export class TenantGroupRolesComponent implements OnInit {
  private readonly api = inject(TenantWorkspaceService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly matrix = signal<TenantGroupRolesPage | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly page = signal(1);
  readonly pending = signal<TenantGroupRoleItem | null>(null);
  readonly error = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  ngOnInit(): void { this.load(); }

  private groupId(): string | null {
    const id = this.route.snapshot.paramMap.get('id');
    return id && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)
      ? id : null;
  }

  load(): void {
    if (this.loading() || this.saving()) return;
    this.matrix.set(null);
    this.pending.set(null);
    this.error.set(null);
    this.saveError.set(null);
    const groupId = this.groupId();
    if (!groupId) {
      this.error.set('شناسه گروه معتبر نیست.');
      return;
    }
    const requestedPage = this.page();
    this.loading.set(true);
    this.api.getGroupRoles(groupId, requestedPage)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: matrix => {
          this.loading.set(false);
          if (!matrix || matrix.groupId?.toLowerCase() !== groupId.toLowerCase() ||
              !Array.isArray(matrix.items) || matrix.page !== requestedPage ||
              typeof matrix.canEdit !== 'boolean' ||
              typeof matrix.groupIsActive !== 'boolean' ||
              typeof matrix.hasNext !== 'boolean' ||
              typeof matrix.version !== 'string') {
            this.error.set('پاسخ سرویس نقش‌های گروه معتبر نیست.');
          } else {
            this.matrix.set(matrix);
          }
        },
        error: (err: { status?: number }) => {
          this.loading.set(false);
          this.matrix.set(null);
          this.error.set([401, 403].includes(err?.status ?? 0)
            ? 'مجوز مشاهده نقش‌های گروه معتبر نیست یا لغو شده است.'
            : err?.status === 404 ? 'گروه متعلق به این فضای کاری نیست.'
              : 'دریافت نقش‌های گروه ناموفق بود؛ دوباره تلاش کنید.');
        },
      });
  }

  previous(): void {
    if (!this.loading() && !this.saving() && this.page() > 1) {
      this.page.update(p => p - 1);
      this.load();
    }
  }

  next(): void {
    if (!this.loading() && !this.saving() && this.matrix()?.hasNext &&
        this.page() < 1000) {
      this.page.update(p => p + 1);
      this.load();
    }
  }

  requestChange(role: TenantGroupRoleItem): void {
    const matrix = this.matrix();
    if (!matrix?.canEdit || !matrix.version ||
        this.loading() || this.saving() || this.pending() ||
        !matrix.items.some(x => x.id === role.id &&
          x.assigned === role.assigned && x.isActive === role.isActive) ||
        (!role.assigned && (!matrix.groupIsActive || !role.isActive))) return;
    this.notice.set(null);
    this.saveError.set(null);
    this.pending.set(role);
  }

  cancelChange(): void {
    if (this.saving()) return;
    this.pending.set(null);
    this.saveError.set(null);
  }

  confirmChange(): void {
    const role = this.pending();
    const matrix = this.matrix();
    const groupId = this.groupId();
    if (!role || !matrix?.canEdit || !matrix.version || !groupId ||
        this.loading() || this.saving() ||
        !matrix.items.some(x => x.id === role.id &&
          x.assigned === role.assigned && x.isActive === role.isActive) ||
        (!role.assigned && (!matrix.groupIsActive || !role.isActive))) return;
    this.saving.set(true);
    this.saveError.set(null);
    this.api.changeGroupRole(groupId, role.id, !role.assigned, matrix.version)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: data => {
          this.saving.set(false);
          this.pending.set(null);
          if (!data?.version) {
            this.matrix.set(null);
            this.error.set('نتیجه تغییر نقش معتبر نیست؛ داده‌های گروه را دوباره بررسی کنید.');
            return;
          }
          this.notice.set(role.assigned ? 'نقش از گروه لغو شد.' : 'نقش به گروه اضافه شد.');
          this.load();
        },
        error: (err: { status?: number }) => {
          this.saving.set(false);
          this.pending.set(null);
          if ([401, 403, 404].includes(err?.status ?? 0)) {
            this.matrix.set(null);
            this.error.set('مجوز تغییر نقش لغو شده یا نقش/گروه قابل‌دسترسی نیست.');
          } else if (err?.status === 409) {
            this.notice.set('گروه تغییر کرده است. نسخه جدید دریافت شد؛ دوباره تأیید کنید.');
            this.load();
          } else {
            this.saveError.set(err?.status === 400
              ? 'شناسه نقش یا نسخه گروه معتبر نیست.'
              : 'ثبت نقش گروه انجام نشد؛ دوباره بررسی کنید.');
          }
        },
      });
  }
}
