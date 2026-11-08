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

    const pending = {
      userName: 'new.staff', email: 'new@local.test', firstName: 'New', lastName: 'Staff',
    };
    api.createPendingMember(pending).subscribe();
    const createMember = http.expectOne(environment.apiUrl + '/tenant/workspace/members');
    expect(createMember.request.method).toBe('POST');
    expect(createMember.request.body).toEqual(pending);
    expect(createMember.request.body).not.toHaveProperty('tenantId');
    expect(createMember.request.body).not.toHaveProperty('isActive');
    expect(createMember.request.body).not.toHaveProperty('password');
    expect(createMember.request.body).not.toHaveProperty('roleIds');
    createMember.flush({ id: 'new-id', ...pending, isActive: false });

    api.getRolePermissions('owned-role-id').subscribe();
    const matrix = http.expectOne(environment.apiUrl +
      '/tenant/workspace/roles/owned-role-id/permissions');
    expect(matrix.request.method).toBe('GET');
    expect(matrix.request.params.keys()).toEqual([]);
    matrix.flush({ roleId: 'owned-role-id', roleName: 'Operator', permissions: [] });

    api.replaceRolePermissions('owned-role-id', 'AAAAAAAABAA=', [
      'TENANT.MEMBERS.READ',
    ]).subscribe();
    const replace = http.expectOne(environment.apiUrl +
      '/tenant/workspace/roles/owned-role-id/permissions');
    expect(replace.request.method).toBe('PUT');
    expect(replace.request.body).toEqual({
      expectedVersion: 'AAAAAAAABAA=', codes: ['TENANT.MEMBERS.READ'],
    });
    expect(replace.request.body).not.toHaveProperty('tenantId');
    expect(replace.request.body).not.toHaveProperty('actorUserId');
    replace.flush({ version: 'AAAAAAAABAE=' });

    api.createRole({ name: 'Reception', description: 'Front desk' }).subscribe();
    const roleCreate = http.expectOne(environment.apiUrl + '/tenant/workspace/roles');
    expect(roleCreate.request.method).toBe('POST');
    expect(roleCreate.request.body).toEqual({ name: 'Reception', description: 'Front desk' });
    expect(roleCreate.request.body).not.toHaveProperty('tenantId');
    expect(roleCreate.request.body).not.toHaveProperty('scope');
    roleCreate.flush({ id: 'owned-role', name: 'Reception', description: 'Front desk',
      isActive: true, isOwner: false, version: 'AQIDBAUGBwg=' });

    api.updateRole('owned-role', { name: 'Reception 2', description: null,
      expectedVersion: 'AQIDBAUGBwg=' }).subscribe();
    const roleUpdate = http.expectOne(environment.apiUrl + '/tenant/workspace/roles/owned-role');
    expect(roleUpdate.request.method).toBe('PUT');
    expect(roleUpdate.request.body).toEqual({ name: 'Reception 2', description: null,
      expectedVersion: 'AQIDBAUGBwg=' });
    roleUpdate.flush({ id: 'owned-role', name: 'Reception 2', description: null,
      isActive: true, isOwner: false, version: 'AgIDBAUGBwg=' });

    api.changeRoleState('owned-role', { isActive: false,
      expectedVersion: 'AgIDBAUGBwg=' }).subscribe();
    const roleState = http.expectOne(environment.apiUrl + '/tenant/workspace/roles/owned-role/state');
    expect(roleState.request.method).toBe('PATCH');
    expect(roleState.request.body).toEqual({ isActive: false,
      expectedVersion: 'AgIDBAUGBwg=' });
    roleState.flush({ id: 'owned-role', name: 'Reception 2', description: null,
      isActive: false, isOwner: false, version: 'AwIDBAUGBwg=' });

    api.getMemberRoles('member-1').subscribe();
    const memberRoles = http.expectOne(environment.apiUrl +
      '/tenant/workspace/members/member-1/roles');
    expect(memberRoles.request.method).toBe('GET');
    expect(memberRoles.request.params.keys()).toEqual([]);
    memberRoles.flush({ userId: 'member-1', userName: 'staff', version: 'AQIDBAUGBwg=',
      canEdit: true, roles: [] });

    api.replaceMemberRoles('member-1', 'AQIDBAUGBwg=', ['role-1']).subscribe();
    const changeMemberRoles = http.expectOne(environment.apiUrl +
      '/tenant/workspace/members/member-1/roles');
    expect(changeMemberRoles.request.method).toBe('PUT');
    expect(changeMemberRoles.request.body).toEqual({
      expectedVersion: 'AQIDBAUGBwg=', roleIds: ['role-1'],
    });
    expect(changeMemberRoles.request.body).not.toHaveProperty('tenantId');
    expect(changeMemberRoles.request.body).not.toHaveProperty('actorUserId');
    changeMemberRoles.flush({ version: 'AQIDBAUGBwk=' });

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
