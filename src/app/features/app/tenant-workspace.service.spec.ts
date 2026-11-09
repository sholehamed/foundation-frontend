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

    api.createMemberWithInitialPassword(pending).subscribe();
    const oneStep = http.expectOne(environment.apiUrl +
      '/tenant/workspace/members/with-initial-password');
    expect(oneStep.request.method).toBe('POST');
    expect(oneStep.request.body).toEqual(pending);
    expect(oneStep.request.body).not.toHaveProperty('tenantId');
    expect(oneStep.request.body).not.toHaveProperty('password');
    expect(oneStep.request.body).not.toHaveProperty('isActive');
    expect(oneStep.request.body).not.toHaveProperty('roleIds');
    oneStep.flush({
      member: { id: 'new-staff-id', ...pending, isActive: false },
      temporaryPassword: 'ABCDEF-ghijkl-MNOPQR-stuvwx',
      expiresAtUtc: '2026-11-09T12:30:00Z',
    });

    api.getMemberAudit(2, '11111111-1111-1111-1111-111111111111').subscribe();
    const audit = http.expectOne(req => req.url === environment.apiUrl +
      '/tenant/workspace/members/audit');
    expect(audit.request.method).toBe('GET');
    expect(audit.request.params.keys().sort()).toEqual(['memberId', 'page']);
    expect(audit.request.params.get('memberId')).toBe(
      '11111111-1111-1111-1111-111111111111');
    expect(audit.request.params.get('page')).toBe('2');
    expect(audit.request.params.has('tenantId')).toBe(false);
    expect(audit.request.params.has('actorUserId')).toBe(false);
    audit.flush({ items: [], pageNumber: 2, hasNext: false });

    api.getGroupSecurityAudit('group-local', 2).subscribe();
    const groupAudit = http.expectOne(req => req.url === environment.apiUrl +
      '/tenant/workspace/groups/group-local/audit');
    expect(groupAudit.request.method).toBe('GET');
    expect(groupAudit.request.params.keys()).toEqual(['page']);
    expect(groupAudit.request.params.get('page')).toBe('2');
    expect(groupAudit.request.params.has('tenantId')).toBe(false);
    expect(groupAudit.request.params.has('actorId')).toBe(false);
    groupAudit.flush({
      groupId: 'group-local', groupName: 'Reception', items: [],
      pageNumber: 2, hasNext: false, integrity: {
        memberLinks: 0, roleLinks: 0, ownerMemberLinks: 0,
        invalidMemberLinks: 0, invalidRoleLinks: 0,
        unattributedMemberLinks: 0, unattributedRoleLinks: 0,
      },
    });

    api.getGroupRoles('group-local', 2).subscribe();
    const groupRoles = http.expectOne(req => req.url === environment.apiUrl +
      '/tenant/workspace/groups/group-local/roles');
    expect(groupRoles.request.method).toBe('GET');
    expect(groupRoles.request.params.keys()).toEqual(['page']);
    expect(groupRoles.request.params.get('page')).toBe('2');
    expect(groupRoles.request.params.has('tenantId')).toBe(false);
    groupRoles.flush({ groupId: 'group-local', groupName: 'Reception',
      groupIsActive: true, version: 'AQIDBAUGBwg=', canEdit: true,
      items: [], page: 2, hasNext: false });

    api.changeGroupRole('group-local', 'role-local', true, 'AQIDBAUGBwg=').subscribe();
    const roleLink = http.expectOne(environment.apiUrl +
      '/tenant/workspace/groups/group-local/roles/role-local');
    expect(roleLink.request.method).toBe('PUT');
    expect(roleLink.request.body).toEqual({
      assigned: true, expectedVersion: 'AQIDBAUGBwg=',
    });
    expect(roleLink.request.body).not.toHaveProperty('tenantId');
    expect(roleLink.request.body).not.toHaveProperty('actorUserId');
    expect(roleLink.request.body).not.toHaveProperty('roleIds');
    roleLink.flush({ version: 'AgMEBQYHCAk=' });

    api.getGroupMembers('group-local', 2).subscribe();
    const groupMembers = http.expectOne(req => req.url === environment.apiUrl +
      '/tenant/workspace/groups/group-local/members');
    expect(groupMembers.request.method).toBe('GET');
    expect(groupMembers.request.params.keys()).toEqual(['page']);
    expect(groupMembers.request.params.get('page')).toBe('2');
    expect(groupMembers.request.params.has('tenantId')).toBe(false);
    groupMembers.flush({ groupId: 'group-local', groupName: 'Reception',
      version: 'AQIDBAUGBwg=', groupIsActive: true,
      canEdit: true, items: [], page: 2, hasNext: false });

    api.changeGroupMember('group-local', 'staff-local', true, 'AQIDBAUGBwg=').subscribe();
    const memberLink = http.expectOne(environment.apiUrl +
      '/tenant/workspace/groups/group-local/members/staff-local');
    expect(memberLink.request.method).toBe('PUT');
    expect(memberLink.request.body).toEqual({
      assigned: true, expectedVersion: 'AQIDBAUGBwg=',
    });
    expect(memberLink.request.body).not.toHaveProperty('tenantId');
    expect(memberLink.request.body).not.toHaveProperty('actorUserId');
    expect(memberLink.request.body).not.toHaveProperty('roleIds');
    memberLink.flush({ version: 'AgMEBQYHCAk=' });

    api.createGroup({ name: 'Reception', description: null }).subscribe();
    const groupCreate = http.expectOne(environment.apiUrl + '/tenant/workspace/groups');
    expect(groupCreate.request.method).toBe('POST');
    expect(groupCreate.request.body).toEqual({ name: 'Reception', description: null });
    expect(groupCreate.request.body).not.toHaveProperty('tenantId');
    expect(groupCreate.request.body).not.toHaveProperty('userIds');
    expect(groupCreate.request.body).not.toHaveProperty('roleIds');
    groupCreate.flush({ id: 'group-1', name: 'Reception', description: null,
      isActive: true, version: 'AQIDBAUGBwg=' });

    api.updateGroup('group-1', {
      name: 'Reception 2', description: null, expectedVersion: 'AQIDBAUGBwg=',
    }).subscribe();
    const groupUpdate = http.expectOne(environment.apiUrl + '/tenant/workspace/groups/group-1');
    expect(groupUpdate.request.method).toBe('PUT');
    expect(groupUpdate.request.body).toEqual({
      name: 'Reception 2', description: null, expectedVersion: 'AQIDBAUGBwg=',
    });
    expect(groupUpdate.request.body).not.toHaveProperty('tenantId');
    groupUpdate.flush({ id: 'group-1', name: 'Reception 2', description: null,
      isActive: true, version: 'AgIDBAUGBwg=' });

    api.changeGroupState('group-1', {
      isActive: false, expectedVersion: 'AgIDBAUGBwg=',
    }).subscribe();
    const groupState = http.expectOne(environment.apiUrl +
      '/tenant/workspace/groups/group-1/state');
    expect(groupState.request.method).toBe('PATCH');
    expect(groupState.request.body).toEqual({
      isActive: false, expectedVersion: 'AgIDBAUGBwg=',
    });
    groupState.flush({ id: 'group-1', name: 'Reception 2', description: null,
      isActive: false, version: 'AwIDBAUGBwg=' });

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

    api.issueTemporaryPassword('member-1').subscribe();
    const initial = http.expectOne(environment.apiUrl +
      '/tenant/workspace/members/member-1/temporary-password');
    expect(initial.request.method).toBe('POST');
    expect(initial.request.body).toEqual({});
    expect(initial.request.body).not.toHaveProperty('tenantId');
    expect(initial.request.body).not.toHaveProperty('password');
    expect(initial.request.body).not.toHaveProperty('roleIds');
    initial.flush({ temporaryPassword: 'ABCDEF-ghijkl-MNOPQR-stuvwx',
      expiresAtUtc: '2026-11-09T12:30:00Z' });

    api.invitePendingMember('member-1').subscribe();
    const sendInvitation = http.expectOne(environment.apiUrl +
      '/tenant/workspace/members/member-1/invitations');
    expect(sendInvitation.request.method).toBe('POST');
    expect(sendInvitation.request.body).toEqual({});
    expect(sendInvitation.request.body).not.toHaveProperty('tenantId');
    expect(sendInvitation.request.body).not.toHaveProperty('token');
    expect(sendInvitation.request.body).not.toHaveProperty('password');
    sendInvitation.flush({ status: 'submitted', expiresAtUtc: '2026-11-09T12:30:00Z' });

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
