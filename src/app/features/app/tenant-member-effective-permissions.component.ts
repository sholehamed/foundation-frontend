import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import {
  TenantMemberEffectivePermissionEntry, TenantMemberPermissionSource,
  TenantMemberEffectivePermissionReport, TenantWorkspaceService,
} from './tenant-workspace.service';

type ViewFilter = 'all' | 'allowed' | 'denied';

/**
 * Read-only effective Tenant catalog report, not a privilege editor. The
 * backend independently checks Owner and Members+Roles+Groups PAGE access.
 */
@Component({
  selector: 'app-tenant-member-effective-permissions',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  templateUrl: './tenant-member-effective-permissions.component.html',
  styleUrl: './tenant-workspace.styles.scss',
  styles: [`
    .effective-summary { display:flex; flex-wrap:wrap; align-items:center; gap:12px; margin:12px 0; }
    .effective-summary strong { font-weight:750; }
    .effective-permissions { display:grid; gap:12px; margin-top:14px; }
    .effective-item { border:1px solid #e4dbe2; border-radius:12px; padding:14px; }
    .effective-item-header { display:flex; align-items:flex-start; gap:12px; flex-wrap:wrap;
      justify-content:space-between; }
    .effective-item h2 { font-size:16px; margin:0 0 5px; }
    .effective-item p { font-size:13px; margin:5px 0; line-height:1.8; }
    .effective-code { display:inline-block; overflow-wrap:anywhere; direction:ltr;
      unicode-bidi:isolate; font-size:12px; }
    .effective-sources { margin:8px 0 0; padding-inline-start:20px; }
    .effective-sources li { margin:5px 0; font-size:13px; overflow-wrap:anywhere; }
    .effective-status { font-weight:700; }
    .effective-status-denied { opacity:.72; }
    .effective-filter { display:flex; flex-wrap:wrap; gap:8px; margin-top:14px; }
  `],
})
export class TenantMemberEffectivePermissionsComponent implements OnInit {
  private readonly api = inject(TenantWorkspaceService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly report = signal<TenantMemberEffectivePermissionReport | null>(null);
  readonly filter = signal<ViewFilter>('all');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly canRetry = signal(true);
  readonly visible = computed(() => {
    const items = this.report()?.items ?? [];
    switch (this.filter()) {
      case 'allowed': return items.filter(x => x.allowed);
      case 'denied': return items.filter(x => !x.allowed);
      default: return items;
    }
  });
  readonly allowedCount = computed(() =>
    this.report()?.items.filter(x => x.allowed).length ?? 0);

  ngOnInit(): void { this.load(); }

  private memberId(): string | null {
    const id = this.route.snapshot.paramMap.get('id');
    return id && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)
      ? id : null;
  }

  setFilter(next: ViewFilter): void { this.filter.set(next); }

  load(): void {
    if (this.loading() || !this.canRetry()) return;
    const id = this.memberId();
    this.report.set(null);
    this.error.set(null);
    if (!id) {
      this.canRetry.set(false);
      this.error.set('شناسه عضو معتبر نیست.');
      return;
    }
    this.loading.set(true);
    this.api.getMemberEffectivePermissions(id)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: data => {
          this.loading.set(false);
          if (!data || data.userId?.toLowerCase() !== id.toLowerCase() ||
              typeof data.userActive !== 'boolean' ||
              typeof data.isOwner !== 'boolean' ||
              !Array.isArray(data.items) ||
              new Set(data.items.map(x => x.code)).size !== data.items.length ||
              !data.items.every(x =>
                typeof x.code === 'string' && x.code.startsWith('TENANT.') &&
                (x.kind === 'PAGE' || x.kind === 'ACTION') &&
                typeof x.registered === 'boolean' &&
                typeof x.allowed === 'boolean' &&
                typeof x.decision === 'string' &&
                Array.isArray(x.sources) && x.sources.length <= 20 &&
                typeof x.moreSources === 'boolean')) {
            this.report.set(null);
            this.error.set('پاسخ سرویس دسترسی‌های مؤثر معتبر نیست.');
          } else {
            this.report.set(data);
          }
        },
        error: (err: { status?: number }) => {
          this.loading.set(false);
          this.report.set(null);
          if ([401, 403, 404].includes(err?.status ?? 0)) {
            this.canRetry.set(false);
            this.error.set('مجوز مشاهده دسترسی‌ها لغو شده یا عضو قابل‌دسترسی نیست.');
          } else {
            this.error.set('دریافت مجوزهای مؤثر ناموفق بود؛ دوباره تلاش کنید.');
          }
        },
      });
  }

  decisionLabel(item: TenantMemberEffectivePermissionEntry): string {
    const labels: Record<string, string> = {
      account_inactive: 'حساب غیرفعال',
      duplicate_definition: 'تعریف مجوز تکراری است',
      definition_inactive: 'تعریف مجوز غیرفعال است',
      direct_conflict: 'مقادیر مستقیم متعارض یا تکراری',
      direct_allow: 'اجازه مستقیم',
      direct_deny: 'ممنوعیت مستقیم',
      role: 'نقش مستقیم',
      group_role: 'نقش ارث‌بری‌شده از گروه',
      owner_fallback: 'سازگاری نقش Owner',
      no_definition: 'تعریف مجوز ثبت نشده',
      not_granted: 'مسیر اعطای فعال پیدا نشد',
    };
    return labels[item.decision] ?? 'وضعیت مجوز';
  }

  sourceLabel(source: TenantMemberPermissionSource): string {
    switch (source.kind) {
      case 'direct_allow': return 'اجازه مستقیم ثبت‌شده برای کاربر';
      case 'direct_deny': return 'ممنوعیت مستقیم؛ بر سایر مسیرهای اعطا اولویت دارد';
      case 'direct_conflict': return 'چند مقدار مستقیم ناسازگار؛ نتیجه بسته است';
      case 'role': return 'نقش مستقیم: ' + (source.roleName || source.roleId || 'نامشخص');
      case 'group_role':
        return 'گروه ' + (source.groupName || source.groupId || 'نامشخص') +
          ' ← نقش ' + (source.roleName || source.roleId || 'نامشخص');
      case 'owner_fallback': return 'سازگاری قدیمی Owner؛ نه یک Grant صریح';
    }
  }
}
