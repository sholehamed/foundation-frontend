import { TestBed } from '@angular/core/testing';
import { TenantPlanAllowancesComponent } from './tenant-plan-allowances.component';
import { TenantCommercialEntitlementSnapshot } from './tenant-workspace.service';

type Allowance = TenantCommercialEntitlementSnapshot['capabilities'][number];

describe('FR-17C-3A Tenant active PlanVersion allowance display', () => {
  it('distinguishes an explicit zero limit from Unlimited without fabricating usage', async () => {
    await TestBed.configureTestingModule({
      imports: [TenantPlanAllowancesComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(TenantPlanAllowancesComponent);
    const capabilities: Allowance[] = [
      { code: 'staff.active.max', booleanValue: null, integerValue: 0,
        isUnlimited: false, modes: [] },
      { code: 'sms.monthly', booleanValue: null, integerValue: null,
        isUnlimited: true, modes: [] },
      { code: 'appointments.recurring', booleanValue: false, integerValue: null,
        isUnlimited: false, modes: [] },
      { code: 'appointments.confirm-mode', booleanValue: null, integerValue: null,
        isUnlimited: false, modes: ['manual', 'auto'] },
    ];
    fixture.componentRef.setInput('capabilities', capabilities);
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('staff.active.max');
    expect(text).toContain('0');
    expect(text).toContain('sms.monthly');
    expect(text).toContain('نامحدود');
    expect(text).toContain('غیرفعال');
    expect(text).toContain('manual، auto');
    expect(text).toContain('میزان مصرف فعلی و ظرفیت باقی‌مانده هنوز');
    expect(text).not.toContain('۵۰٪ مصرف');
  });

  it('does not pretend that empty capabilities imply an active commercial feature', async () => {
    await TestBed.configureTestingModule({
      imports: [TenantPlanAllowancesComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(TenantPlanAllowancesComponent);
    fixture.componentRef.setInput('capabilities', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'هیچ قابلیت یا سقف اختصاصی برای این پلن ثبت نشده است');
    expect(fixture.nativeElement.querySelectorAll('.tenant-allowance-item').length).toBe(0);
  });
});
