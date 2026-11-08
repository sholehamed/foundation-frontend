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
  branchesManage: 'TENANT.BRANCHES.MANAGE',
  rolePermissionAssign: 'TENANT.ROLES.ASSIGN-PERMISSIONS',
  rolesCreate: 'TENANT.ROLES.CREATE',
  rolesUpdate: 'TENANT.ROLES.UPDATE',
  rolesChangeState: 'TENANT.ROLES.CHANGE-STATE',
  membersAssignRoles: 'TENANT.MEMBERS.ASSIGN-ROLES',
  membersCreate: 'TENANT.MEMBERS.CREATE',
} as const;

export interface TenantUiAccessItem {
  key: string;
  kind: 'PAGE' | 'ACTION';
  route: string;
  allowed: boolean;
}
export interface TenantUiAccessSnapshot { entries: TenantUiAccessItem[]; }

export interface TenantAdminCapabilities {
  canViewAdministration: boolean;
  canViewMembers: boolean;
  canViewRoles: boolean;
  canViewGroups: boolean;
  canManageBranches: boolean;
  canCreateRoles: boolean;
  canUpdateRoles: boolean;
  canChangeRoleState: boolean;
  canAssignMemberRoles: boolean;
  canCreateMembers: boolean;
}
export interface TenantDirectoryPage<T> { items: T[]; page: number; hasNext: boolean; }
export interface TenantAdminMember {
  id: string; userName: string; email: string;
  firstName: string | null; lastName: string | null; isActive: boolean;
}
/** Owner can create only an inactive local account. No invitation is sent. */
export interface TenantPendingMemberCreateRequest {
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
}
export interface TenantPendingMemberCreated extends TenantAdminMember {
  isActive: false;
}

export interface TenantAdminCatalogItem {
  id: string; name: string; description: string | null; isActive: boolean;
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

  getAdminCapabilities(): Observable<TenantAdminCapabilities> {
    return this.http.get<TenantAdminCapabilities>(this.root + '/admin-capabilities');
  }
  getMembers(page = 1): Observable<TenantDirectoryPage<TenantAdminMember>> {
    return this.http.get<TenantDirectoryPage<TenantAdminMember>>(this.root + '/members', { params: { page } });
  }
  /** No TenantId, IsActive, password, Owner flag or roles accepted by this API. */
  createPendingMember(request: TenantPendingMemberCreateRequest): Observable<TenantPendingMemberCreated> {
    return this.http.post<TenantPendingMemberCreated>(this.root + '/members', request);
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

  getGroups(page = 1): Observable<TenantDirectoryPage<TenantAdminCatalogItem>> {
    return this.http.get<TenantDirectoryPage<TenantAdminCatalogItem>>(this.root + '/groups', { params: { page } });
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
