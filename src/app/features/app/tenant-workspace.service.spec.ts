import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { TenantWorkspaceService } from './tenant-workspace.service';

describe('TenantWorkspaceService current-tenant API', () => {
  it('requests only server-scoped tenant workspace/branches, never arbitrary tenantId', () => {
    TestBed.configureTestingModule({ providers: [
      TenantWorkspaceService, provideHttpClient(), provideHttpClientTesting(),
    ] });
    const api = TestBed.inject(TenantWorkspaceService);
    const http = TestBed.inject(HttpTestingController);

    api.getWorkspace().subscribe();
    const workspace = http.expectOne(environment.apiUrl + '/tenant/workspace');
    expect(workspace.request.method).toBe('GET');
    expect(workspace.request.params.keys()).toEqual([]);
    workspace.flush({
      tenant: { id: 'owned', name: 'Current workspace', slug: 'current' },
      profile: null, mainBranch: null, branchesCount: 0,
      subscriptionStatus: 'pending_activation',
    });

    api.getBranches().subscribe();
    const branches = http.expectOne(environment.apiUrl + '/tenant/workspace/branches');
    expect(branches.request.method).toBe('GET');
    expect(branches.request.params.keys()).toEqual([]);
    branches.flush([]);
    http.verify();
  });
});
