import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { TenantWorkspaceService } from './tenant-workspace.service';

describe('FR-17C-1 Tenant subscription shadow HTTP contract', () => {
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
