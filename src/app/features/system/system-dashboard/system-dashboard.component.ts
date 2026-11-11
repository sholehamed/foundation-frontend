import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DashboardService, SuperDashboardDto } from './dashboard.service';
import { SystemCanDirective } from '../../../shared/permissions/system-can.directive';

interface OverviewStat {
  label: string;
  value: number;
  icon: string;
  kind: string;
}

@Component({
  selector: 'app-system-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, MatButtonModule, SystemCanDirective],
  templateUrl: './system-dashboard.component.html',
  styleUrl: './system-dashboard.component.scss',
})
export class SystemDashboardComponent implements OnInit {
  private readonly service = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);

  readonly dashboard = signal<SuperDashboardDto | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly activePercent = computed(() => {
    const value = this.dashboard();
    return value && value.totalTenants > 0
      ? Math.round(value.activeTenants / value.totalTenants * 100)
      : 0;
  });

  readonly stats = computed<OverviewStat[]>(() => {
    const value = this.dashboard();
    if (!value) return [];
    return [
      { label: 'کل کسب‌وکارها', value: value.totalTenants, icon: 'apartment', kind: 'rose' },
      { label: 'کسب‌وکارهای فعال', value: value.activeTenants, icon: 'check_circle', kind: 'green' },
      { label: 'کسب‌وکارهای غیرفعال', value: value.inactiveTenants, icon: 'pause_circle', kind: 'amber' },
      { label: 'کل کاربران', value: value.totalUsers, icon: 'groups', kind: 'blue' },
      { label: 'کاربران فعال', value: value.activeUsers, icon: 'person_check', kind: 'green' },
      { label: 'کل نقش‌ها', value: value.totalRoles, icon: 'admin_panel_settings', kind: 'purple' },
      { label: 'کل مجوزها', value: value.totalPermissions, icon: 'verified_user', kind: 'rose' },
      { label: 'ماژول‌ها', value: value.totalModules, icon: 'view_module', kind: 'blue' },
      { label: 'گروه‌های کاربری', value: value.totalGroups, icon: 'group_work', kind: 'purple' },
    ];
  });

  readonly primaryStats = computed(() => this.stats().slice(0, 4));
  readonly secondaryStats = computed(() => this.stats().slice(4));

  readonly shortcuts = [
    { title: 'مدیریت کسب‌وکارها', description: 'فهرست و وضعیت مستأجرها', path: '/system/tenants', icon: 'domain' },
    { title: 'کاربران', description: 'حساب‌ها و وضعیت دسترسی', path: '/system/users', icon: 'people' },
    { title: 'نقش‌ها', description: 'نقش‌ها و تخصیص مجوز', path: '/system/roles', icon: 'manage_accounts' },
    { title: 'گروه‌ها', description: 'عضویت و نقش گروه‌ها', path: '/system/groups', icon: 'groups' },
    { title: 'ماژول‌ها', description: 'مدیریت ماژول‌ها', path: '/system/modules', icon: 'widgets' },
    { title: 'رجیستری قابلیت‌ها', description: 'بازبینی تعاریف کد و دیتابیس', path: '/system/feature-registry', icon: 'sync' },
    { title: 'پلن‌ها و اشتراک', description: 'ویرایش و انتشار نسخه پلن‌ها', path: '/system/plan-catalog', icon: 'workspace_premium' },
    { title: 'منوی مرکزی', description: 'فهرست و مدیریت ناوبری', path: '/system/menu-management', icon: 'view_list' },
  ] as const;

  ngOnInit(): void { this.load(); }

  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.dashboard.set(null);
    this.error.set(null);
    this.service.getSuperDashboard()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          if (!data || !Array.isArray(data.recentTenants)) {
            this.error.set('پاسخ داشبورد کامل نیست. نسخه Backend را بررسی کنید.');
          } else {
            this.dashboard.set(data);
          }
          this.loading.set(false);
        },
        error: error => {
          this.error.set(error?.status === 403
            ? 'حساب شما مجوز مشاهده داشبورد سیستم را ندارد.'
            : 'دریافت وضعیت سیستم ناموفق بود. اتصال را بررسی کنید و دوباره تلاش کنید.');
          this.loading.set(false);
        },
      });
  }

  hasValidDate(iso: string): boolean {
    return !!iso && Number(iso.substring(0, 4)) >= 2000 &&
      Number.isFinite(new Date(iso).getTime());
  }

  formatPersianDate(value: string): string {
    if (!this.hasValidDate(value)) return '—';
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date(value));
  }
}
