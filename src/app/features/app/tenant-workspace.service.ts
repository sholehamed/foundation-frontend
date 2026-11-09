import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TenantWorkspaceSummary {
  tenant: { id: string; name: string; slug: string };
  profile: {
    displayName: string;
    activityType: string;
    city: string;
    address: string;
    requestedPlanKey: string;
    requestedBillingCycle: string;
  } | null;
  mainBranch: {
    id: string;
    name: string;
    city: string;
    address: string;
  } | null;
  branchesCount: number;
  /** Existing backend placeholder, never an active paid subscription proof. */
  subscriptionStatus: 'pending_activation';
}

export interface TenantBranchWriteRequest {
  name: string;
  city: string;
  address: string;
  phone: string | null;
}

export interface TenantWorkspaceBranch {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string | null;
  isMain: boolean;
}


export const TenantPermissionKeys = {
  members: 'TENANT.MEMBERS.READ',
  roles: 'TENANT.ROLES.READ',
  groups: 'TENANT.GROUPS.READ',
  groupsAssignMembers: 'TENANT.GROUPS.ASSIGN-MEMBERS',
  groupsAssignRoles: 'TENANT.GROUPS.ASSIGN-ROLES',
  groupsCreate: 'TENANT.GROUPS.CREATE',
  groupsUpdate: 'TENANT.GROUPS.UPDATE',
  groupsChangeState: 'TENANT.GROUPS.CHANGE-STATE',
  branchesManage: 'TENANT.BRANCHES.MANAGE',
  rolePermissionAssign: 'TENANT.ROLES.ASSIGN-PERMISSIONS',
  rolesCreate: 'TENANT.ROLES.CREATE',
  rolesUpdate: 'TENANT.ROLES.UPDATE',
  rolesChangeState: 'TENANT.ROLES.CHANGE-STATE',
  membersAssignRoles: 'TENANT.MEMBERS.ASSIGN-ROLES',
  membersCreate: 'TENANT.MEMBERS.CREATE',
  membersInvite: 'TENANT.MEMBERS.INVITE',
  membersIssueTempPassword: 'TENANT.MEMBERS.ISSUE-TEMP-PASSWORD',
} as const;

export interface TenantUiAccessItem {
  key: string;
  kind: 'PAGE' | 'ACTION';
  route: string;
  allowed: boolean;
}
export interface TenantUiAccessSnapshot { entries: TenantUiAccessItem[]; }

/** Backend /tenant/workspace/navigation/me is the sole source of these links.
 * This DTO is a view, NOT a replacement for a PAGE/API authorization guard. */
export interface TenantNavigationItem {
  title: string;
  icon: string | null;
  route: string | null;
  externalUrl: string | null;
  childs: TenantNavigationItem[];
}
export interface TenantNavigationCategory {
  title: string;
  items: TenantNavigationItem[];
}

export interface TenantAdminCapabilities {
  canViewAdministration: boolean;
  canViewMembers: boolean;
  canViewMemberAudit: boolean;
  canViewMemberEffectivePermissions: boolean;
  canViewGroupAudit: boolean;
  canViewRoles: boolean;
  canViewGroups: boolean;
  canCreateGroups: boolean;
  canUpdateGroups: boolean;
  canChangeGroupState: boolean;
  canAssignGroupMembers: boolean;
  canAssignGroupRoles: boolean;
  canManageBranches: boolean;
  canCreateRoles: boolean;
  canUpdateRoles: boolean;
  canChangeRoleState: boolean;
  canAssignMemberRoles: boolean;
  canCreateMembers: boolean;
  canInviteMembers: boolean;
  canIssueTemporaryPassword: boolean;
}
export interface TenantDirectoryPage<T> { items: T[]; page: number; hasNext: boolean; }
export interface TenantAdminMember {
  id: string; userName: string; email: string | null;
  firstName: string | null; lastName: string | null; isActive: boolean;
}
/** Owner can create only an inactive local account. No invitation is sent. */
export interface TenantPendingMemberCreateRequest {
  userName: string;
  email: string | null;
  firstName: string;
  lastName: string;
}
export interface TenantPendingMemberCreated extends TenantAdminMember {
  isActive: false;
}
/** Returned only once by the explicit Owner 2-permission onboarding write. */
export interface TenantMemberWithInitialPassword {
  member: TenantPendingMemberCreated;
  temporaryPassword: string;
  expiresAtUtc: string;
}

/** Read-only security ledger: backend never sends credentials or email addresses. */
export interface TenantMemberAuditEntry {
  id: string;
  category: 'member' | 'member_role';
  action: string;
  occurredAtUtc: string;
  actorUserId: string;
  actorUserName: string | null;
  targetUserId: string;
  targetUserName: string | null;
  roleName: string | null;
}
export interface TenantMemberAuditPage {
  items: TenantMemberAuditEntry[];
  pageNumber: number;
  hasNext: boolean;
}

/** Append-only Group lifecycle, membership and role grant history. */
export interface TenantGroupSecurityAuditEntry {
  id: string;
  category: 'group' | 'group_member' | 'group_role';
  action: string; occurredAtUtc: string;
  actorUserId: string; actorUserName: string | null;
  targetUserId: string | null; targetUserName: string | null;
  roleId: string | null; roleName: string | null;
  previousName: string | null; currentName: string | null;
  previousActive: boolean | null; currentActive: boolean | null;
}
/** Counters are read-only. Unattributed does not mean unauthorized. */
export interface TenantGroupIntegrity {
  memberLinks: number; roleLinks: number;
  ownerMemberLinks: number; invalidMemberLinks: number; invalidRoleLinks: number;
  unattributedMemberLinks: number; unattributedRoleLinks: number;
}
export interface TenantGroupSecurityAuditPage {
  groupId: string; groupName: string;
  items: TenantGroupSecurityAuditEntry[]; pageNumber: number; hasNext: boolean;
  integrity: TenantGroupIntegrity;
}

/** Candidate grant path. Direct deny takes precedence over inherited grants. */
export interface TenantMemberPermissionSource {
  kind: 'direct_allow' | 'direct_deny' | 'direct_conflict' | 'role' |
    'group_role' | 'owner_fallback';
  roleId: string | null; roleName: string | null;
  groupId: string | null; groupName: string | null;
}
export interface TenantMemberEffectivePermissionEntry {
  code: string; name: string; kind: 'PAGE' | 'ACTION'; route: string;
  registered: boolean; allowed: boolean; decision: string;
  sources: TenantMemberPermissionSource[]; moreSources: boolean;
}
export interface TenantMemberEffectivePermissionReport {
  userId: string; userName: string; userActive: boolean; isOwner: boolean;
  items: TenantMemberEffectivePermissionEntry[];
}

export interface TenantAdminCatalogItem {
  id: string; name: string; description: string | null; isActive: boolean;
}
export interface TenantAdminGroup extends TenantAdminCatalogItem {
  version: string;
}
export interface TenantGroupWriteRequest {
  name: string;
  description: string | null;
}
export interface TenantGroupUpdateRequest extends TenantGroupWriteRequest {
  expectedVersion: string;
}
export interface TenantGroupStateRequest {
  isActive: boolean;
  expectedVersion: string;
}
export interface TenantAdminRole extends TenantAdminCatalogItem {
  isOwner: boolean;
  version: string;
}
export interface TenantRoleWriteRequest {
  name: string;
  description: string | null;
}
export interface TenantRoleUpdateRequest extends TenantRoleWriteRequest {
  expectedVersion: string;
}
export interface TenantRoleStateRequest {
  isActive: boolean;
  expectedVersion: string;
}
export interface TenantRolePermissionEntry {
  code: string;
  name: string;
  kind: 'PAGE' | 'ACTION';
  route: string;
  registered: boolean;
  granted: boolean;
}
export interface TenantRolePermissionMatrix {
  roleId: string;
  roleName: string;
  permissions: TenantRolePermissionEntry[];
  version: string;
  canEdit: boolean;
}
export interface TenantGroupMemberItem { id: string; userName: string; assigned: boolean; }
export interface TenantGroupRoleItem {
  id: string; name: string; isActive: boolean; assigned: boolean;
}
export interface TenantGroupRolesPage {
  groupId: string; groupName: string; version: string; groupIsActive: boolean;
  canEdit: boolean; items: TenantGroupRoleItem[]; page: number; hasNext: boolean;
}

export interface TenantGroupMembersPage {
  groupId: string; groupName: string; version: string; groupIsActive: boolean; canEdit: boolean;
  items: TenantGroupMemberItem[]; page: number; hasNext: boolean;
}
export interface TenantMemberRoleItem {
  id: string;
  name: string;
  isActive: boolean;
  assigned: boolean;
}
export interface TenantMemberRolesMatrix {
  userId: string;
  userName: string;
  version: string;
  canEdit: boolean;
  roles: TenantMemberRoleItem[];
}
export type TenantDirectoryKind = 'members' | 'roles' | 'groups';
export type TenantDirectoryItem = TenantAdminMember | TenantAdminCatalogItem;

@Injectable({ providedIn: 'root' })
export class TenantWorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly root = environment.apiUrl + '/tenant/workspace';

  /** Tenant ID is derived by the server from the authenticated tenant session. */
  getWorkspace(): Observable<TenantWorkspaceSummary> {
    return this.http.get<TenantWorkspaceSummary>(this.root);
  }



  /** UI is a hint; backend rechecks the same live permission per protected operation. */
  getUiAccess(): Observable<TenantUiAccessSnapshot> {
    return this.http.get<TenantUiAccessSnapshot>(this.root + '/ui-access/me');
  }

  /** FR-14C-1: read-only Tenant scoped, live permission-filtered Menu tree. */
  getNavigation(): Observable<TenantNavigationCategory[]> {
    return this.http.get<TenantNavigationCategory[]>(this.root + '/navigation/me');
  }

  getAdminCapabilities(): Observable<TenantAdminCapabilities> {
    return this.http.get<TenantAdminCapabilities>(this.root + '/admin-capabilities');
  }
  getMembers(page = 1): Observable<TenantDirectoryPage<TenantAdminMember>> {
    return this.http.get<TenantDirectoryPage<TenantAdminMember>>(this.root + '/members', { params: { page } });
  }

  /** Page and optional target member only; TenantId and actor are server-derived. */
  getMemberAudit(page = 1, memberId?: string | null): Observable<TenantMemberAuditPage> {
    const params: Record<string, string> = { page: String(page) };
    if (memberId) params['memberId'] = memberId;
    return this.http.get<TenantMemberAuditPage>(this.root + '/members/audit', { params });
  }
  /** Read-only live Tenant permission decisions for one member; server binds Tenant. */
  getMemberEffectivePermissions(memberId: string):
    Observable<TenantMemberEffectivePermissionReport> {
    return this.http.get<TenantMemberEffectivePermissionReport>(
      this.root + '/members/' + encodeURIComponent(memberId) + '/effective-permissions');
  }

  /** No TenantId, IsActive, password, Owner flag or roles accepted by this API. */
  createPendingMember(request: TenantPendingMemberCreateRequest): Observable<TenantPendingMemberCreated> {
    return this.http.post<TenantPendingMemberCreated>(this.root + '/members', request);
  }
  /** Token is sent ONLY to registered member email, never returned to this API. */
  invitePendingMember(memberId: string): Observable<{ status: 'submitted'; expiresAtUtc: string }> {
    return this.http.post<{ status: 'submitted'; expiresAtUtc: string }>(
      this.root + '/members/' + encodeURIComponent(memberId) + '/invitations', {},
    );
  }

  /**
   * Returns an initial password ONCE, for explicit in-person handoff.
   * Caller MUST clear it from JS state on close/navigate; never store it.
   */
  issueTemporaryPassword(memberId: string): Observable<{
    temporaryPassword: string; expiresAtUtc: string;
  }> {
    return this.http.post<{ temporaryPassword: string; expiresAtUtc: string }>(
      this.root + '/members/' + encodeURIComponent(memberId) + '/temporary-password', {},
    );
  }

  /** Atomic inactive User + one-time password, both audited inside one SQL transaction. */
  createMemberWithInitialPassword(
    request: TenantPendingMemberCreateRequest,
  ): Observable<TenantMemberWithInitialPassword> {
    return this.http.post<TenantMemberWithInitialPassword>(
      this.root + '/members/with-initial-password', request,
    );
  }

  getRoles(page = 1): Observable<TenantDirectoryPage<TenantAdminRole>> {
    return this.http.get<TenantDirectoryPage<TenantAdminRole>>(this.root + '/roles', { params: { page } });
  }

  /** Direct UserRole matrix; never represents inherited/effective rights. */
  getMemberRoles(memberId: string): Observable<TenantMemberRolesMatrix> {
    return this.http.get<TenantMemberRolesMatrix>(
      this.root + '/members/' + encodeURIComponent(memberId) + '/roles',
    );
  }

  replaceMemberRoles(
    memberId: string, expectedVersion: string, roleIds: string[],
  ): Observable<{ version: string }> {
    return this.http.put<{ version: string }>(
      this.root + '/members/' + encodeURIComponent(memberId) + '/roles',
      { expectedVersion, roleIds },
    );
  }

  createRole(request: TenantRoleWriteRequest): Observable<TenantAdminRole> {
    return this.http.post<TenantAdminRole>(this.root + '/roles', request);
  }

  updateRole(roleId: string, request: TenantRoleUpdateRequest): Observable<TenantAdminRole> {
    return this.http.put<TenantAdminRole>(
      this.root + '/roles/' + encodeURIComponent(roleId), request);
  }

  changeRoleState(roleId: string, request: TenantRoleStateRequest): Observable<TenantAdminRole> {
    return this.http.patch<TenantAdminRole>(
      this.root + '/roles/' + encodeURIComponent(roleId) + '/state', request);
  }

  /** Read-only direct grants on an owned Tenant role, NOT the actor's effective permissions. */
  getRolePermissions(roleId: string): Observable<TenantRolePermissionMatrix> {
    return this.http.get<TenantRolePermissionMatrix>(
      this.root + '/roles/' + encodeURIComponent(roleId) + '/permissions',
    );
  }

  replaceRolePermissions(
    roleId: string, expectedVersion: string, codes: string[],
  ): Observable<{ version: string }> {
    return this.http.put<{ version: string }>(
      this.root + '/roles/' + encodeURIComponent(roleId) + '/permissions',
      { expectedVersion, codes },
    );
  }

  getGroups(page = 1): Observable<TenantDirectoryPage<TenantAdminGroup>> {
    return this.http.get<TenantDirectoryPage<TenantAdminGroup>>(
      this.root + '/groups', { params: { page } });
  }

  /** Owner-only history and historical link indicators; no repair endpoint. */
  getGroupSecurityAudit(groupId: string, page = 1): Observable<TenantGroupSecurityAuditPage> {
    return this.http.get<TenantGroupSecurityAuditPage>(
      this.root + '/groups/' + encodeURIComponent(groupId) + '/audit',
      { params: { page } });
  }

  createGroup(request: TenantGroupWriteRequest): Observable<TenantAdminGroup> {
    return this.http.post<TenantAdminGroup>(this.root + '/groups', request);
  }

  updateGroup(groupId: string, request: TenantGroupUpdateRequest): Observable<TenantAdminGroup> {
    return this.http.put<TenantAdminGroup>(
      this.root + '/groups/' + encodeURIComponent(groupId), request);
  }

  changeGroupState(groupId: string, request: TenantGroupStateRequest): Observable<TenantAdminGroup> {
    return this.http.patch<TenantAdminGroup>(
      this.root + '/groups/' + encodeURIComponent(groupId) + '/state', request);
  }

  /** Read one page of ordinary Tenant roles, never a whole-Group replacement. */
  getGroupRoles(groupId: string, page = 1): Observable<TenantGroupRolesPage> {
    return this.http.get<TenantGroupRolesPage>(
      this.root + '/groups/' + encodeURIComponent(groupId) + '/roles',
      { params: { page } });
  }

  /** One GroupRole pair, CASed against the shared Group row version. */
  changeGroupRole(groupId: string, roleId: string,
    assigned: boolean, expectedVersion: string): Observable<{ version: string }> {
    return this.http.put<{ version: string }>(
      this.root + '/groups/' + encodeURIComponent(groupId) +
      '/roles/' + encodeURIComponent(roleId), { assigned, expectedVersion });
  }

  /** Server-bound Tenant/actor. Read only 20 eligible ordinary members at a time. */
  getGroupMembers(groupId: string, page = 1): Observable<TenantGroupMembersPage> {
    return this.http.get<TenantGroupMembersPage>(
      this.root + '/groups/' + encodeURIComponent(groupId) + '/members', { params: { page } });
  }

  /** One membership mutation, never a bulk replacement of a partial page. */
  changeGroupMember(groupId: string, userId: string,
    assigned: boolean, expectedVersion: string): Observable<{ version: string }> {
    return this.http.put<{ version: string }>(
      this.root + '/groups/' + encodeURIComponent(groupId) +
      '/members/' + encodeURIComponent(userId), { assigned, expectedVersion });
  }

  createBranch(request: TenantBranchWriteRequest): Observable<TenantWorkspaceBranch> {
    return this.http.post<TenantWorkspaceBranch>(this.root + '/branches', request);
  }

  updateBranch(id: string, request: TenantBranchWriteRequest): Observable<TenantWorkspaceBranch> {
    return this.http.put<TenantWorkspaceBranch>(this.root + '/branches/' + encodeURIComponent(id), request);
  }

  getBranches(): Observable<TenantWorkspaceBranch[]> {
    return this.http.get<TenantWorkspaceBranch[]>(this.root + '/branches');
  }
}
