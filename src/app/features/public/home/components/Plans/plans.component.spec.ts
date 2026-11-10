import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CustomizerSettingsService } from '../../../../../shared/services/customizer-settings.service';
import { PublicPlansService } from '../../../shared/public-plans.service';
import { PlansComponent } from './plans.component';

const demo = {
  code: 'pro', versionId: 'version-1', title: 'پلن حرفه‌ای',
  subtitle: 'مناسب تیم', badge: 'پیشنهادی', isRecommended: true, displayOrder: 2,
  prices: [{ billingCycle: 'monthly', currency: 'IRR', amount: 2000000 }],
  features: [{ kind: 'Benefit' as const, title: 'پشتیبانی ویژه',
    description: null, isHighlighted: true }],
};

describe('Public plan cards', () => {
  async function setup(result: ReturnType<PublicPlansService['list']>) {
    await TestBed.configureTestingModule({
      imports: [PlansComponent],
      providers: [
        provideRouter([]),
        { provide: PublicPlansService, useValue: { list: () => result } },
        { provide: CustomizerSettingsService, useValue: { isRTLEnabledTheme: () => true } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PlansComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the published title, exact IRR currency and offer, and dynamic features', async () => {
    const fixture = await setup(of([demo]));
    const page: HTMLElement = fixture.nativeElement;
    expect(page.textContent).toContain('پلن حرفه‌ای');
    expect(page.textContent).toContain('پشتیبانی ویژه');
    expect(page.textContent).toContain('ریال');
    expect(page.querySelectorAll('.single-pricing-box')).toHaveLength(1);
    expect(page.querySelector('a[href*="plan=pro"]')).not.toBeNull();
  });

  it('shows a truthful empty catalog instead of legacy static prices', async () => {
    const fixture = await setup(of([]));
    expect((fixture.nativeElement as HTMLElement).textContent)
      .toContain('هنوز پلن منتشرشده');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.single-pricing-box'))
      .toHaveLength(0);
  });

  it('shows a retryable state after API failure', async () => {
    const fixture = await setup(throwError(() => new Error('offline')));
    expect((fixture.nativeElement as HTMLElement).getAttribute('id')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('تلاش دوباره');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.single-pricing-box'))
      .toHaveLength(0);
  });
});
