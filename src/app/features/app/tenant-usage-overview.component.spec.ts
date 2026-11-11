import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { TenantUsageOverviewComponent } from './tenant-usage-overview.component';

describe('FR-17D-2B Tenant owner usage rendering', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantUsageOverviewComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('fetches only current Tenant owner usage, no browser TenantId or user-defined period', () => {
    const fixture = TestBed.createComponent(TenantUsageOverviewComponent);
    fixture.detectChanges();
    const req = http.expectOne(environment.apiUrl + '/tenant/workspace/subscription/usage');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys()).toEqual([]);
    expect(req.request.body).toBeNull();
    req.flush({
      status: 'Active', reason: 'authoritative_current_usage',
      subscriptionId: 'server-selected-subscription', items: [
        {
          code: 'appointments.monthly', kind: 'PeriodQuota', state: 'Measured',
          isUnlimited: false, limit: '5', currentUsage: '3', remaining: '2',
          periodStartUtc: '2026-11-05T12:00:00Z',
          periodEndUtc: '2026-12-05T12:00:00Z',
          periodCadence: 'MonthlyAnniversary', overLimit: false,
        },
        {
          code: 'appointments.max-active', kind: 'CountLimit',
          state: 'DomainCountUnavailable', isUnlimited: false,
          limit: '2', currentUsage: null, remaining: null,
          periodStartUtc: null, periodEndUtc: null,
          periodCadence: null, overLimit: false,
        },
      ],
    });
    fixture.detectChanges();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('appointments.monthly');
    expect(text).toContain('مصرف ثبت‌شده');
    expect(text).toContain('باقی‌مانده');
    expect(text).toContain('شمارش موجودیت‌های فعال هنوز');
    expect(text).toContain('توسط Backend');
    expect(text).not.toContain('server-selected-subscription');
  });

  it('shows an expected owner-only message on 403 without calling it a broken subscription', () => {
    const fixture = TestBed.createComponent(TenantUsageOverviewComponent);
    fixture.detectChanges();
    const req = http.expectOne(environment.apiUrl + '/tenant/workspace/subscription/usage');
    req.flush({ code: 'forbidden' }, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('فقط برای مالک این فضای کاری');
    expect(text).not.toContain('دریافت مصرف از سرور انجام نشد');
  });

  it('retains exact SQL bigint units above JS safe integer and distinguishes unknown from 0', () => {
    const fixture = TestBed.createComponent(TenantUsageOverviewComponent);
    const component = fixture.componentInstance;
    expect(component.formatUnits('9007199254740993')).toBe('۹٬۰۰۷٬۱۹۹٬۲۵۴٬۷۴۰٬۹۹۳');
    expect(component.formatUnits('0')).toBe('۰');
    expect(component.formatUnits(null)).toBe('نامشخص');
    expect(component.formatUnits('NaN')).toBe('نامشخص');
    expect(component.stateMessage('PeriodConflict')).toContain('پایگاه داده');
    fixture.detectChanges();
    http.expectOne(environment.apiUrl + '/tenant/workspace/subscription/usage').flush({
      status: 'NotSubscribed', reason: 'no_active_subscription',
      subscriptionId: null, items: [],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'اشتراک تجاری فعالی برای گزارش مصرف تأیید نشده است');
  });
});
