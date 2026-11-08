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

export interface TenantWorkspaceBranch {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string | null;
  isMain: boolean;
}

@Injectable({ providedIn: 'root' })
export class TenantWorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly root = environment.apiUrl + '/tenant/workspace';

  /** Tenant ID is derived by the server from the authenticated tenant session. */
  getWorkspace(): Observable<TenantWorkspaceSummary> {
    return this.http.get<TenantWorkspaceSummary>(this.root);
  }

  getBranches(): Observable<TenantWorkspaceBranch[]> {
    return this.http.get<TenantWorkspaceBranch[]>(this.root + '/branches');
  }
}
