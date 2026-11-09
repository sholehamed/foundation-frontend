import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import {
  TenantGroupMemberItem, TenantGroupMembersPage, TenantWorkspaceService,
} from './tenant-workspace.service';

/**
 * One-member-at-a-time, Owner-only privileged writes. A paged member view
 * must never be submitted as a replacement for all members in the Group.
 */
@Component({
  selector: 'app-tenant-group-members',
  standalone: true,
  imports: [MatButtonModule, RouterLink],
  templateUrl: './tenant-group-members.component.html',
  styleUrl: './tenant-workspace.styles.scss',
})
export class TenantGroupMembersComponent implements OnInit {
  private readonly api = inject(TenantWorkspaceService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly matrix = signal<TenantGroupMembersPage | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly page = signal(1);
  readonly pending = signal<TenantGroupMemberItem | null>(null);
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
    const id = this.groupId();
    if (!id) {
      this.error.set('شناسه گروه معتبر نیست.');
      return;
    }
    const requestedPage = this.page();
    this.loading.set(true);
    this.api.getGroupMembers(id, requestedPage)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: value => {
          this.loading.set(false);
          if (!value || value.groupId?.toLowerCase() !== id.toLowerCase() ||
              !Array.isArray(value.items) || value.page !== requestedPage ||
              typeof value.canEdit !== 'boolean' ||
              typeof value.groupIsActive !== 'boolean' ||
              typeof value.hasNext !== 'boolean' ||
              typeof value.version !== 'string') {
            this.error.set('پاسخ سرویس عضویت گروه معتبر نیست.');
          } else {
            this.matrix.set(value);
          }
        },
        error: (err: { status?: number }) => {
          this.loading.set(false);
          this.matrix.set(null);
          this.error.set([401, 403].includes(err?.status ?? 0)
            ? 'مجوز مشاهده اعضای گروه معتبر نیست یا لغو شده است.'
            : err?.status === 404 ? 'گروه متعلق به این فضای کاری نیست.'
              : 'دریافت اعضای گروه ناموفق بود؛ دوباره تلاش کنید.');
        },
      });
  }

  previous(): void {
    if (!this.loading() && !this.saving() && this.page() > 1) {
      this.page.update(x => x - 1);
      this.load();
    }
  }

  next(): void {
    if (!this.loading() && !this.saving() && this.matrix()?.hasNext &&
        this.page() < 1000) {
      this.page.update(x => x + 1);
      this.load();
    }
  }

  requestChange(item: TenantGroupMemberItem): void {
    const matrix = this.matrix();
    if (!matrix?.canEdit || !matrix.version || this.loading() || this.saving() ||
        !matrix.items.some(x => x.id === item.id && x.assigned === item.assigned) ||
        (!item.assigned && !matrix.groupIsActive)) return;
    this.notice.set(null);
    this.saveError.set(null);
    this.pending.set(item);
  }

  cancelChange(): void {
    if (this.saving()) return;
    this.pending.set(null);
    this.saveError.set(null);
  }

  confirmChange(): void {
    const item = this.pending();
    const matrix = this.matrix();
    const groupId = this.groupId();
    if (!item || !matrix?.canEdit || !matrix.version || !groupId ||
        this.loading() || this.saving() ||
        !matrix.items.some(x => x.id === item.id && x.assigned === item.assigned) ||
        (!item.assigned && !matrix.groupIsActive)) return;
    this.saving.set(true);
    this.saveError.set(null);
    this.api.changeGroupMember(groupId, item.id, !item.assigned, matrix.version)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: result => {
          this.saving.set(false);
          this.pending.set(null);
          if (!result?.version) {
            this.matrix.set(null);
            this.error.set('پاسخ سرویس تغییر عضویت معتبر نیست؛ وضعیت گروه را دوباره بررسی کنید.');
            return;
          }
          this.notice.set(item.assigned ? 'عضویت کاربر لغو شد.' : 'عضو به گروه اضافه شد.');
          this.load();
        },
        error: (err: { status?: number }) => {
          this.saving.set(false);
          this.pending.set(null);
          if ([401, 403, 404].includes(err?.status ?? 0)) {
            this.matrix.set(null);
            this.error.set('مجوز تغییر عضویت لغو شده یا کاربر/گروه مجاز نیست.');
          } else if (err?.status === 409) {
            this.notice.set('عضویت گروه هم‌زمان تغییر کرده است. داده‌های تازه بارگذاری شدند؛ مجدداً بررسی کنید.');
            this.load();
          } else {
            this.saveError.set(err?.status === 400
              ? 'شناسه عضو یا نسخه گروه معتبر نیست.'
              : 'تغییر عضویت انجام نشد؛ دوباره بررسی کنید.');
          }
        },
      });
  }
}
