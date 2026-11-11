import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { TenantWorkspaceService } from './tenant-workspace.service';

describe('FR-17C-1 Tenant subscription shadow HTTP contract', () => {
  it('creates pending order without a client price, tenant ID or settlement flag', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const api = TestBed.inject(TenantWorkspaceService);
    const http = TestBed.inject(HttpTestingController);
    api.listMyPlanOrders().subscribe();
    const list = http.expectOne(environment.apiUrl + '/tenant/workspace/subscription/orders');
    expect(list.request.method).toBe('GET');
    list.flush([]);
    api.createMyPlanOrder('published-version-1', 'monthly', 'idempotency-request-1234').subscribe();
    const order = http.expectOne(environment.apiUrl + '/tenant/workspace/subscription/orders');
    expect(order.request.method).toBe('POST');
    expect(order.request.body).toEqual({
      planVersionId: 'published-version-1',
      billingCycle: 'monthly',
      idempotencyKey: 'idempotency-request-1234',
    });
    expect(order.request.body).not.toHaveProperty('tenantId');
    expect(order.request.body).not.toHaveProperty('grossAmount');
    expect(order.request.body).not.toHaveProperty('isPaid');
    order.flush({ ok: true, code: 'created_pending', order: null });
    http.verify();
  });

  it('reads the current authenticated Tenant only, without an editable TenantId', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const api = TestBed.inject(TenantWorkspaceService);
    const http = TestBed.inject(HttpTestingController);
    let status = '';
    api.getSubscriptionShadow().subscribe(result => {
      status = result.status;
    });
    const req = http.expectOne(environment.apiUrl + '/tenant/workspace/subscription/me');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys()).toEqual([]);
    expect(req.request.body).toBeNull();
    req.flush({
      status: 'NotSubscribed', reason: 'no_active_subscription',
      subscriptionId: null, planVersionId: null, startsAtUtc: null,
      endsAtUtc: null, hasCommercialEntitlement: false, moduleCodes: [],
      capabilities: [],
    });
    expect(status).toBe('NotSubscribed');
    http.verify();
  });
});
