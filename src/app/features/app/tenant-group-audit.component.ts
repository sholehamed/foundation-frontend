import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import {
  TenantGroupSecurityAuditEntry, TenantGroupSecurityAuditPage, TenantWorkspaceService,
} from './tenant-workspace.service';

/** Read-only historical security review; never add remediation writes here. */
@Component({
  selector: 'app-tenant-group-audit',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  templateUrl: './tenant-group-audit.component.html',
  styleUrl: './tenant-workspace.styles.scss',
})
export class TenantGroupAuditComponent implements OnInit {
  private readonly api = inject(TenantWorkspaceService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly data = signal<TenantGroupSecurityAuditPage | null>(null);
  readonly page = signal(1);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly canRetry = signal(true);

  ngOnInit(): void { this.load(); }

  private groupId(): string | null {
    const id = this.route.snapshot.paramMap.get('id');
    return id && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)
      ? id : null;
  }

  load(): void {
    if (this.loading() || !this.canRetry()) return;
    const id = this.groupId();
    this.data.set(null);
    this.error.set(null);
    if (!id) {
      this.error.set('شناسه گروه معتبر نیست.');
      this.canRetry.set(false);
      return;
    }
    const requestedPage = this.page();
    this.loading.set(true);
    this.api.getGroupSecurityAudit(id, requestedPage)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: result => {
          this.loading.set(false);
          if (!result || result.groupId?.toLowerCase() !== id.toLowerCase() ||
              result.pageNumber !== requestedPage ||
              !Array.isArray(result.items) ||
              typeof result.hasNext !== 'boolean' ||
              !result.integrity ||
              !this.validIntegrity(result.integrity)) {
            this.error.set('پاسخ تاریخچه امنیتی گروه معتبر نیست.');
          } else {
            this.data.set(result);
          }
        },
        error: (err: { status?: number }) => {
          this.loading.set(false);
          this.data.set(null);
          if ([401, 403, 404].includes(err?.status ?? 0)) {
            this.canRetry.set(false);
            this.error.set('مجوز مشاهده تاریخچه گروه لغو شده یا گروه قابل‌دسترسی نیست.');
          } else {
            this.error.set('دریافت تاریخچه گروه ناموفق بود؛ دوباره تلاش کنید.');
          }
        },
      });
  }

  private validIntegrity(value: TenantGroupSecurityAuditPage['integrity']): boolean {
    return [
      value.memberLinks, value.roleLinks, value.ownerMemberLinks,
      value.invalidMemberLinks, value.invalidRoleLinks,
      value.unattributedMemberLinks, value.unattributedRoleLinks,
    ].every(x => Number.isSafeInteger(x) && x >= 0);
  }

  next(): void {
    if (this.loading() || !this.data()?.hasNext || this.page() >= 1000) return;
    this.page.update(x => x + 1);
    this.load();
  }

  previous(): void {
    if (this.loading() || this.page() <= 1) return;
    this.page.update(x => x - 1);
    this.load();
  }

  label(event: TenantGroupSecurityAuditEntry): string {
    if (event.category === 'group_member') {
      return event.action === 'grant' ? 'افزودن عضو به گروه'
        : event.action === 'revoke' ? 'لغو عضویت گروه' : 'تغییر عضویت گروه';
    }
    if (event.category === 'group_role') {
      return event.action === 'grant' ? 'اتصال نقش به گروه'
        : event.action === 'revoke' ? 'لغو نقش گروه' : 'تغییر نقش گروه';
    }
    const labels: Record<string, string> = {
      create: 'گروه ایجاد شد',
      update: 'مشخصات گروه تغییر کرد',
      state: 'وضعیت گروه تغییر کرد',
    };
    return labels[event.action] ?? 'تغییر گروه';
  }

  detail(event: TenantGroupSecurityAuditEntry): string {
    if (event.category === 'group_member')
      return 'عضو: ' + (event.targetUserName || event.targetUserId || 'نامشخص');
    if (event.category === 'group_role')
      return 'نقش: ' + (event.roleName || event.roleId || 'نامشخص');
    const name = event.currentName || 'نامشخص';
    if (event.action === 'state' && event.currentActive !== null) {
      return 'گروه «' + name + '» — ' +
        (event.currentActive ? 'فعال' : 'غیرفعال');
    }
    return 'گروه: ' + name +
      (event.previousName && event.previousName !== event.currentName
        ? ' (قبلاً: ' + event.previousName + ')' : '');
  }

  formatOccurredAt(utc: string): string {
    const date = new Date(utc);
    if (Number.isNaN(date.getTime())) return 'زمان نامشخص';
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      dateStyle: 'medium', timeStyle: 'short',
    }).format(date);
  }
}
