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


    api.getUiAccess().subscribe();
    const ui = http.expectOne(environment.apiUrl + '/tenant/workspace/ui-access/me');
    expect(ui.request.method).toBe('GET');
    expect(ui.request.params.keys()).toEqual([]);
    ui.flush({ entries: [
      { key: 'TENANT.MEMBERS.READ', kind: 'PAGE', route: '/dashboard/members', allowed: true },
    ] });

    api.getAdminCapabilities().subscribe();
    const capabilities = http.expectOne(environment.apiUrl + '/tenant/workspace/admin-capabilities');
    expect(capabilities.request.method).toBe('GET');
    expect(capabilities.request.params.keys()).toEqual([]);
    capabilities.flush({ canViewAdministration: true });

    for (const [kind, send] of [
      ['members', () => api.getMembers(2).subscribe()],
      ['roles', () => api.getRoles(2).subscribe()],
      ['groups', () => api.getGroups(2).subscribe()],
    ] as const) {
      send();
      const request = http.expectOne(req => req.url ===
        environment.apiUrl + '/tenant/workspace/' + kind);
      expect(request.request.method).toBe('GET');
      expect(request.request.params.keys()).toEqual(['page']);
      expect(request.request.params.get('page')).toBe('2');
      request.flush({ items: [], page: 2, hasNext: false });
    }

    api.getRolePermissions('owned-role-id').subscribe();
    const matrix = http.expectOne(environment.apiUrl +
      '/tenant/workspace/roles/owned-role-id/permissions');
    expect(matrix.request.method).toBe('GET');
    expect(matrix.request.params.keys()).toEqual([]);
    matrix.flush({ roleId: 'owned-role-id', roleName: 'Operator', permissions: [] });

    const payload = { name: 'Branch', city: 'Tehran', address: 'Street', phone: null };
    api.createBranch(payload).subscribe();
    const create = http.expectOne(environment.apiUrl + '/tenant/workspace/branches');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(payload);
    expect(create.request.body).not.toHaveProperty('tenantId');
    expect(create.request.body).not.toHaveProperty('isMain');
    create.flush({ id: 'new-branch', ...payload, isMain: false });

    api.updateBranch('owned-id', payload).subscribe();
    const update = http.expectOne(environment.apiUrl + '/tenant/workspace/branches/owned-id');
    expect(update.request.method).toBe('PUT');
    expect(update.request.body).toEqual(payload);
    update.flush({ id: 'owned-id', ...payload, isMain: false });
    http.verify();
  });
});
