import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { SYSTEM_UI_ACCESS_PILOT_ENABLED } from '../../../shared/permissions/system-ui-access-pilot.token';
import { DashboardService, SuperDashboardDto } from './dashboard.service';
import { SystemDashboardComponent } from './system-dashboard.component';

const sample: SuperDashboardDto = {
  totalTenants: 10, activeTenants: 7, inactiveTenants: 3,
  totalUsers: 42, activeUsers: 35, systemUsers: 4, tenantUsers: 38,
  totalRoles: 6, totalPermissions: 22, totalGroups: 2, totalModules: 8,
  recentTenants: [
    { id: '55555555-5555-4555-8555-555555555555', name: 'نمونه کسب‌وکار',
      slug: 'sample', isActive: true, createdAt: '2026-11-01T00:00:00' },
  ],
};

describe('SystemDashboardComponent — meaningful state and numbers', () => {
  let fixture: ComponentFixture<SystemDashboardComponent>;
  let load: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    load = vi.fn(() => of(sample));
    await TestBed.configureTestingModule({
      imports: [SystemDashboardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: SYSTEM_UI_ACCESS_PILOT_ENABLED, useValue: false },
        { provide: DashboardService, useValue: { getSuperDashboard: load } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SystemDashboardComponent);
  });

  afterEach(() => fixture.destroy());

  it('loads on entry, renders real role count instead of user count, and real newest tenant', () => {
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(load).toHaveBeenCalledOnce();
    expect(component.stats().find(x => x.label === 'کل نقش‌ها')?.value).toBe(6);
    expect(component.stats().find(x => x.label === 'کل کاربران')?.value).toBe(42);
    expect(component.activePercent()).toBe(70);
    expect(fixture.nativeElement.textContent).toContain('نمونه کسب‌وکار');
    expect(fixture.nativeElement.textContent).toContain('کسب‌وکارهای فعال7');
  });

  it('renders the operational hero and concise KPIs from the same backend response', () => {
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.system-command-hero')).toBeTruthy();
    expect(element.querySelector('.system-health-ring')?.getAttribute('aria-label'))
      .toContain('70 درصد');
    expect(element.querySelectorAll('.stats-grid:not(.supporting-stats) .stat-card').length).toBe(4);
    expect(element.querySelectorAll('.supporting-stats .stat-card').length).toBe(5);
    expect(fixture.componentInstance.primaryStats()[0].value).toBe(10);
    expect(fixture.componentInstance.secondaryStats().length).toBe(5);
    expect(fixture.componentInstance.formatPersianDate('invalid')).toBe('—');
    expect(fixture.componentInstance.formatPersianDate('2026-11-01T00:00:00Z'))
      .not.toBe('—');
    expect(element.textContent).not.toContain('درآمد امروز');
  });

  it('shows loading then a genuine empty-business state without fabricated data', () => {
    const pending = new Subject<SuperDashboardDto>();
    load.mockReturnValue(pending.asObservable());
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('در حال دریافت');
    expect(fixture.componentInstance.loading()).toBe(true);

    pending.next({ ...sample, totalTenants: 0, activeTenants: 0,
      inactiveTenants: 0, recentTenants: [] });
    pending.complete();
    fixture.detectChanges();
    expect(fixture.componentInstance.activePercent()).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('هنوز کسب‌وکاری');
    expect(fixture.nativeElement.textContent).toContain('فعلاً کسب‌وکاری');
  });

  it('clears stale results after HTTP failure and recovers on explicit retry', () => {
    load.mockReturnValueOnce(throwError(() => ({ status: 403 })))
      .mockReturnValueOnce(of(sample));
    fixture.detectChanges();
    expect(fixture.componentInstance.dashboard()).toBeNull();
    expect(fixture.componentInstance.error()).toContain('مجوز');
    expect(fixture.nativeElement.textContent).toContain('تلاش مجدد');

    fixture.componentInstance.load();
    fixture.detectChanges();
    expect(fixture.componentInstance.error()).toBeNull();
    expect(fixture.componentInstance.dashboard()?.totalRoles).toBe(6);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('does not present an incompatible partial API response as a healthy dashboard', () => {
    load.mockReturnValue(of({ ...sample, recentTenants: undefined }));
    fixture.detectChanges();
    expect(fixture.componentInstance.dashboard()).toBeNull();
    expect(fixture.componentInstance.error()).toContain('نسخه Backend');
  });
});
