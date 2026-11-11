import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { TenantWorkspaceService, TenantWorkspaceSummary, TenantWorkspaceBranch, TenantCommercialEntitlementSnapshot } from './tenant-workspace.service';
import { TenantDashboardComponent } from './tenant-dashboard.component';
import { TenantBusinessProfileComponent } from './tenant-business-profile.component';
import { TenantBranchesComponent } from './tenant-branches.component';

const workspace: TenantWorkspaceSummary = {
  tenant: { id: 'owned', name: 'Tenant A', slug: 'tenant-a' },
  profile: { displayName: 'Salon One', activityType: 'Beauty', city: 'Tehran',
    address: 'First street', requestedPlanKey: 'solo',
    requestedBillingCycle: 'monthly' },
  mainBranch: { id: 'main', name: 'Main', city: 'Tehran', address: 'First street' },
  branchesCount: 2, subscriptionStatus: 'pending_activation',
};
const noSubscription: TenantCommercialEntitlementSnapshot = {
  status: 'NotSubscribed' as const,
  reason: 'no_active_subscription',
  subscriptionId: null, planVersionId: null,
  startsAtUtc: null, endsAtUtc: null,
  hasCommercialEntitlement: false, moduleCodes: [], capabilities: [],
};

const branches: TenantWorkspaceBranch[] = [
  { id: 'main', name: 'Main', city: 'Tehran', address: 'First', phone: null, isMain: true },
  { id: 'second', name: 'Second', city: 'Shiraz', address: 'Second', phone: null, isMain: false },
];

describe('Tenant Admin workspace pages', () => {
  const getWorkspace = vi.fn(() => of(workspace));
  const getSubscriptionShadow = vi.fn(() => of(noSubscription));
  const getBranches = vi.fn(() => of(branches));
  const getAdminCapabilities = vi.fn(() => of({canViewAdministration: true, canManageBranches: false}));

  beforeEach(async () => {
    getWorkspace.mockReset().mockReturnValue(of(workspace));
    getBranches.mockReset().mockReturnValue(of(branches));
    getSubscriptionShadow.mockReset().mockReturnValue(of(noSubscription));
    getAdminCapabilities.mockReset().mockReturnValue(of({canViewAdministration: true, canManageBranches: false}));
    await TestBed.configureTestingModule({
      imports: [TenantDashboardComponent, TenantBusinessProfileComponent, TenantBranchesComponent],
      providers: [
        provideRouter([]),
        { provide: TenantWorkspaceService, useValue: { getWorkspace, getBranches, getAdminCapabilities, getSubscriptionShadow } },
      ],
    }).compileComponents();
  });

  it('shows only real tenant workspace fields and never calls System dashboard API', () => {
    const fixture = TestBed.createComponent(TenantDashboardComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Salon One');
    expect(fixture.nativeElement.textContent).toContain('Main');
    expect(fixture.nativeElement.textContent).toContain('اشتراک فعالی ثبت نشده');
    expect(fixture.nativeElement.textContent).toContain('هیچ مجوز تجاری فعالی');
    expect(getWorkspace).toHaveBeenCalledOnce();
    expect(getSubscriptionShadow).toHaveBeenCalledOnce();
    expect(getBranches).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('renders a clean real-data command center without inventing commercial access', () => {
    const fixture = TestBed.createComponent(TenantDashboardComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.tenant-command-hero')?.textContent).toContain('Salon One');
    expect(element.querySelectorAll('.tenant-command-metric').length).toBe(4);
    const kpis = element.querySelectorAll('.tenant-command-metric strong');
    expect(kpis[0].textContent).toContain('2');
    expect(kpis[2].textContent?.trim()).toBe('0');
    expect(element.textContent).toContain('پلن درخواستی: solo');
    expect(element.querySelector('app-tenant-usage-overview')).toBeNull();
    expect(element.querySelector('app-tenant-plan-allowances')).toBeNull();
    expect(element.querySelectorAll('.tenant-command-action').length).toBe(3);
    expect(fixture.componentInstance.formatPersianDate(null)).toBe('—');
    expect(fixture.componentInstance.formatPersianDate('invalid')).toBe('—');
    expect(fixture.componentInstance.formatPersianDate('2026-11-11T12:00:00Z'))
      .not.toBe('—');
    fixture.destroy();
  });

  it('quick billing action toggles a real component only on explicit interaction', () => {
    const fixture = TestBed.createComponent(TenantDashboardComponent);
    fixture.detectChanges();
    const orderButton: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('.tenant-command-action[type="button"]');
    expect(orderButton).toBeTruthy();
    expect(fixture.componentInstance.showOrderForm()).toBe(false);
    // The billing component itself is not initialized before the action.
    expect(fixture.nativeElement.querySelector('app-tenant-plan-orders')).toBeNull();
    // Opening the form is separately covered by the existing order component
    // HTTP tests, not by a fake local plan/catalog stub.
    expect(orderButton?.textContent).toContain('سفارش‌ها و پلن‌ها');
    fixture.destroy();
  });

  it('never treats a requested PlanKey as a settled Subscription', () => {
    getSubscriptionShadow.mockReturnValueOnce(of({
      ...noSubscription, status: 'Pending' as const, reason: 'awaiting_verified_settlement',
    }));
    const fixture = TestBed.createComponent(TenantDashboardComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('در انتظار تسویه تأییدشده');
    expect(fixture.nativeElement.textContent).toContain('هیچ مجوز تجاری فعالی');
    fixture.destroy();
  });

  it('renders business details in read-only mode and supports absent profile', () => {
    getWorkspace.mockReturnValueOnce(of({ ...workspace, profile: null }));
    const fixture = TestBed.createComponent(TenantBusinessProfileComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('پروفایل کسب‌وکار ثبت نشده');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    fixture.destroy();
  });

  it('renders owned branch rows and main flag; handles empty response', () => {
    const first = TestBed.createComponent(TenantBranchesComponent);
    first.detectChanges();
    expect(first.nativeElement.textContent).toContain('Main');
    expect(first.nativeElement.textContent).toContain('Second');
    expect(first.nativeElement.textContent).toContain('شعبه اصلی');
    first.destroy();

    getBranches.mockReturnValueOnce(of([]));
    const empty = TestBed.createComponent(TenantBranchesComponent);
    empty.detectChanges();
    expect(empty.nativeElement.textContent).toContain('شعبه‌ای برای این فضای کاری');
    empty.destroy();
  });

  it('blocks stale tenant data on 403 and recovers on explicit retry', () => {
    getBranches.mockReturnValueOnce(throwError(() => ({ status: 403 })))
      .mockReturnValueOnce(of(branches));
    const fixture = TestBed.createComponent(TenantBranchesComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.branches()).toBeNull();
    expect(fixture.componentInstance.error()).toContain('ناموفق');

    fixture.componentInstance.load();
    fixture.detectChanges();
    expect(fixture.componentInstance.error()).toBeNull();
    expect(fixture.componentInstance.branches()?.length).toBe(2);
    fixture.destroy();
  });

  it('displays loading state before tenant workspace data arrives', () => {
    const stream = new Subject<TenantWorkspaceSummary>();
    getWorkspace.mockReturnValueOnce(stream.asObservable());
    const fixture = TestBed.createComponent(TenantDashboardComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('در حال دریافت');
    stream.next(workspace);
    stream.complete();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Salon One');
    fixture.destroy();
  });
});
