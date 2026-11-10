import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BackendFeatureManifest } from './feature-registry-contract';

export type FeatureRegistryStatus = 'Create' | 'Present' | 'UpdateRoute' | 'Conflict';

export interface FeatureRegistryChange {
  type: string;
  key: string;
  state: FeatureRegistryStatus;
  detail: string | null;
}

export interface FeatureRegistryPreview {
  fingerprint: string;
  canApply: boolean;
  hasPending: boolean;
  changes: FeatureRegistryChange[];
}

/** Read-only, System-owned registry diagnostics. No Tenant or role identifiers. */
export interface TenantPermissionCatalogPreview extends FeatureRegistryPreview {
  fingerprint: string;
}

export interface TenantNavigationRouteStatus {
  route: string;
  requiredPermission: string | null;
  status: 'ready' | 'missing' | 'conflict';
  issues: string[];
}

export interface TenantNavigationReadiness {
  readyForDynamicPilot: boolean;
  requiredRoutes: number;
  readyRoutes: number;
  routes: TenantNavigationRouteStatus[];
  unregisteredTenantRoutes: string[];
  ungatedExternalMenuCount: number;
}

export interface SystemEndpointIntegrityStatus {
  key: string;
  httpMethod: string;
  route: string;
  resourceCode: string;
  permissionCode: string;
  status: 'ready' | 'conflict';
  issues: string[];
}

export interface SystemEndpointIntegrity {
  readyForGranularEnforcement: boolean;
  discoveredFeatureEndpoints: number;
  readyFeatureEndpoints: number;
  endpoints: SystemEndpointIntegrityStatus[];
  uncatalogedSystemAdminRoutes: string[];
  unreviewedActiveSystemApiKeys: string[];
  reviewedInternalSystemRoutes: number;
  outOfScopeRouteCount: number;
}

/** Server-side, read-only aggregate of four System-owned central catalog checks. */
export interface CentralAccessCheck {
  ready: boolean;
  conflicts: number;
  pending: number;
  observed: number;
  fingerprint: string | null;
}

export interface CentralAccessReadiness {
  centralCatalogConsistent: boolean;
  blockingChecks: string[];
  systemRegistry: CentralAccessCheck;
  tenantPermissionCatalog: CentralAccessCheck;
  tenantNavigation: CentralAccessCheck;
  systemEndpoints: CentralAccessCheck;
}

@Injectable({ providedIn: 'root' })
export class FeatureRegistryApiService {
  private readonly http = inject(HttpClient);
  private readonly root = environment.apiUrl + '/system/FeatureRegistry';

  /** Source-owned feature keys and access rules from the Backend. */
  manifest(): Observable<BackendFeatureManifest> {
    return this.http.get<BackendFeatureManifest>(this.root + '/manifest');
  }

  preview(): Observable<FeatureRegistryPreview> {
    return this.http.get<FeatureRegistryPreview>(this.root + '/preview');
  }

  /** Extra live SuperAdmin check on the backend; strictly read-only. */
  tenantPermissionPreview(): Observable<TenantPermissionCatalogPreview> {
    return this.http.get<TenantPermissionCatalogPreview>(this.root + '/tenant-permissions/preview');
  }

  /** Explicit System SuperAdmin operator action; server validates the preview fingerprint and default-OFF flag. */
  tenantPermissionApply(fingerprint: string): Observable<TenantPermissionCatalogPreview> {
    return this.http.post<TenantPermissionCatalogPreview>(
      this.root + '/tenant-permissions/apply', { fingerprint });
  }

  tenantNavigationReadiness(): Observable<TenantNavigationReadiness> {
    return this.http.get<TenantNavigationReadiness>(this.root + '/tenant-navigation/readiness');
  }

  systemEndpointIntegrity(): Observable<SystemEndpointIntegrity> {
    return this.http.get<SystemEndpointIntegrity>(this.root + '/system-endpoints/integrity');
  }

  /** Same persisted SuperAdmin boundary as the individual diagnostics; no writes. */
  centralAccessReadiness(): Observable<CentralAccessReadiness> {
    return this.http.get<CentralAccessReadiness>(this.root + '/central-access/readiness');
  }

  /** Explicit, reviewed System SuperAdmin Apply; server rechecks fingerprint in SQL. */
  apply(fingerprint: string): Observable<FeatureRegistryPreview> {
    return this.http.post<FeatureRegistryPreview>(this.root + '/apply', { fingerprint });
  }
}
