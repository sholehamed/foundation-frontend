import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { PublicPlansService } from './public-plans.service';

describe('PublicPlansService — published plan catalog', () => {
  it('reads the fixed anonymous URL without tenant or role information', () => {
    TestBed.configureTestingModule({
      providers: [PublicPlansService, provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(PublicPlansService);
    const http = TestBed.inject(HttpTestingController);
    let plans = [] as unknown[];
    service.list().subscribe(rows => plans = rows);
    const req = http.expectOne(environment.apiUrl + '/public/plans');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys()).toEqual([]);
    req.flush([{
      code: 'pro', versionId: 'some-version-id', title: 'پلن حرفه‌ای',
      subtitle: 'نمونه', badge: 'جدید', isRecommended: true, displayOrder: 1,
      prices: [{ billingCycle: 'monthly', currency: 'IRR', amount: 1000000 }],
      features: [{ kind: 'Benefit', title: 'پشتیبانی', description: null, isHighlighted: false }],
    }]);
    expect(plans).toHaveLength(1);
    http.verify();
  });
});
