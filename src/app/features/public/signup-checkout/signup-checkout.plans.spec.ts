import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { PublicPlansService } from '../shared/public-plans.service';
import { SignupCheckoutComponent } from './signup-checkout.component';

const published = {
  code: 'pro', versionId: 'version-1', title: 'پلن حرفه‌ای',
  subtitle: 'واقعی و منتشرشده', badge: null, isRecommended: false,
  displayOrder: 0,
  prices: [{ billingCycle: 'yearly', currency: 'IRR', amount: 20000000 }],
  features: [{ kind: 'Module' as const, title: 'نوبت‌دهی',
    description: null, isHighlighted: false }],
};

async function setup(planCode: string | null, plans = [published]) {
  await TestBed.configureTestingModule({
    imports: [SignupCheckoutComponent],
    providers: [
      { provide: PublicPlansService, useValue: { list: () => of(plans) } },
      { provide: ActivatedRoute, useValue: {
        snapshot: {
          paramMap: convertToParamMap({}),
          queryParamMap: convertToParamMap(planCode ? {
            plan: planCode, billingCycle: 'yearly',
          } : {}),
        },
      } },
    ],
  }).overrideComponent(SignupCheckoutComponent, {
    set: { template: '' },
  }).compileComponents();
  return TestBed.createComponent(SignupCheckoutComponent).componentInstance;
}

describe('Signup published plan selection', () => {
  it('honors published deep link without mapping it to a legacy plan', async () => {
    const component = await setup('pro');
    expect(component.selectedPlan?.key).toBe('pro');
    expect(component.billingCycle).toBe('yearly');
    expect(component.selectedPrice).toBe(20000000);
    expect(component.selectedCurrency).toBe('ریال');
  });

  it('never silently falls back from an unknown published plan code', async () => {
    const component = await setup('unknown');
    expect(component.selectedPlan).toBeNull();
    expect(component.form.controls.subscription.controls.planKey.value).toBe('');
    expect(component.signupError()).toContain('کاتالوگ موجود نیست');
  });

  it('keeps core workspace registration when the catalog has zero published offers', async () => {
    const component = await setup(null, []);
    expect(component.choosingWithoutPlan()).toBe(true);
    expect(component.form.controls.subscription.controls.planKey.value).toBe('unselected');
    expect(component.selectedPrice).toBeNull();
  });

  it('does not let an unavailable billing cycle masquerade as a price', async () => {
    const component = await setup('pro');
    component.setBillingCycle('monthly');
    expect(component.billingCycle).toBe('yearly');
  });
});
