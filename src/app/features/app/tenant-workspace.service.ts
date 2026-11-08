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
}
export interface TenantDirectoryPage<T> { items: T[]; page: number; hasNext: boolean; }
export interface TenantAdminMember {
  id: string; userName: string; email: string;
  firstName: string | null; lastName: string | null; isActive: boolean;
}
export interface TenantAdminCatalogItem {
  id: string; name: string; description: string | null; isActive: boolean;
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
  getRoles(page = 1): Observable<TenantDirectoryPage<TenantAdminCatalogItem>> {
    return this.http.get<TenantDirectoryPage<TenantAdminCatalogItem>>(this.root + '/roles', { params: { page } });
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
