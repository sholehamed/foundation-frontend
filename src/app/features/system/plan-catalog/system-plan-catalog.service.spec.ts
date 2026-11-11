import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { SystemPlanCatalogService } from './system-plan-catalog.service';

describe('System Plan Catalog API contract', () => {
  const root = environment.apiUrl + '/system/PlanCatalog';
  let client: SystemPlanCatalogService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    client = TestBed.inject(SystemPlanCatalogService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads only the central System URL without caller tenant/role identifiers', () => {
    client.list().subscribe();
    const list = http.expectOne(root);
    expect(list.request.method).toBe('GET');
    expect(list.request.params.keys()).toEqual([]);
    list.flush([]);

    client.commercialModules().subscribe();
    const modules = http.expectOne(root + '/commercial-modules');
    expect(modules.request.method).toBe('GET');
    modules.flush([]);
  });

  it('requires an explicit receipt attestation for central settlement, not a tenant request', () => {
    client.pendingOrders().subscribe();
    const listing = http.expectOne(root + '/orders/pending');
    expect(listing.request.method).toBe('GET');
    listing.flush([]);
    client.confirmExternalReceipt('order-1', 'receipt-reviewed-101', true).subscribe();
    const attestation = http.expectOne(root + '/orders/order-1/confirm-external');
    expect(attestation.request.method).toBe('POST');
    expect(attestation.request.body).toEqual({
      receiptReference: 'receipt-reviewed-101', paymentVerified: true,
    });
    expect(attestation.request.body).not.toHaveProperty('tenantId');
    expect(attestation.request.body).not.toHaveProperty('netAmount');
    attestation.flush({ ok: true, code: 'settled_and_activated', subscriptionId: 'sub-1' });
  });

  it('issues a secret exactly once and never passes a client-selected coupon code', () => {
    client.listCoupons().subscribe();
    const list = http.expectOne(root + '/coupons');
    expect(list.request.method).toBe('GET');
    list.flush([]);

    const request = {
      title: 'Opening', kind: 'Percentage' as const, value: 100,
      planVersionId: null,
      startsAtUtc: '2026-11-11T08:00:00.000Z',
      endsAtUtc: '2026-12-11T08:00:00.000Z',
      maxUses: 20, maxUsesPerTenant: 1,
    };
    client.issueCoupon(request).subscribe();
    const issue = http.expectOne(root + '/coupons');
    expect(issue.request.method).toBe('POST');
    expect(issue.request.body).toEqual(request);
    expect(issue.request.body).not.toHaveProperty('code');
    expect(issue.request.body).not.toHaveProperty('tenantId');
    issue.flush({ ok: true, code: 'coupon_issued', coupon: null,
      secretCode: 'A'.repeat(24) });

    client.disableCoupon('coupon-id').subscribe();
    const disable = http.expectOne(root + '/coupons/coupon-id/disable');
    expect(disable.request.method).toBe('POST');
    expect(disable.request.body).toEqual({});
    disable.flush({ code: 'coupon_disabled' });
  });

  it('uses reviewed fingerprint in distinct publish POST, not plan edit PUT', () => {
    client.preview('draft-1').subscribe();
    const preview = http.expectOne(root + '/drafts/draft-1/preview');
    expect(preview.request.method).toBe('GET');
    preview.flush({ versionId: 'draft-1', canPublish: false, issues: [] });

    client.publish('draft-1', 'a'.repeat(64)).subscribe();
    const publish = http.expectOne(root + '/drafts/draft-1/publish');
    expect(publish.request.method).toBe('POST');
    expect(publish.request.body).toEqual({ fingerprint: 'a'.repeat(64) });
    expect(publish.request.body).not.toHaveProperty('tenantId');
    expect(publish.request.body).not.toHaveProperty('roleId');
    publish.flush({ ok: false, code: 'catalog_not_publishable' });
  });
});
