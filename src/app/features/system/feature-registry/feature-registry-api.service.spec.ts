import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { FeatureRegistryApiService } from './feature-registry-api.service';

describe('FeatureRegistryApiService admin-only contract', () => {
  it('uses fixed preview/apply routes and sends no role or tenant IDs', () => {
    TestBed.configureTestingModule({
      providers: [FeatureRegistryApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    const api = TestBed.inject(FeatureRegistryApiService);
    const http = TestBed.inject(HttpTestingController);

    api.manifest().subscribe();
    const manifest = http.expectOne(environment.apiUrl + '/system/FeatureRegistry/manifest');
    expect(manifest.request.method).toBe('GET');
    expect(manifest.request.params.keys()).toEqual([]);
    manifest.flush({ schemaVersion: 2, features: [], uiElements: [] });

    api.preview().subscribe();
    const preview = http.expectOne(environment.apiUrl + '/system/FeatureRegistry/preview');
    expect(preview.request.method).toBe('GET');
    expect(preview.request.params.keys()).toEqual([]);
    preview.flush({ fingerprint: 'A'.repeat(64), canApply: true, hasPending: false, changes: [] });

    api.tenantPermissionPreview().subscribe();
    const tenant = http.expectOne(environment.apiUrl + '/system/FeatureRegistry/tenant-permissions/preview');
    expect(tenant.request.method).toBe('GET');
    expect(tenant.request.params.keys()).toEqual([]);
    tenant.flush({ fingerprint: 'A'.repeat(64), canApply: true, hasPending: false, changes: [] });

    api.tenantPermissionApply('A'.repeat(64)).subscribe();
    const tenantApply = http.expectOne(environment.apiUrl + '/system/FeatureRegistry/tenant-permissions/apply');
    expect(tenantApply.request.method).toBe('POST');
    expect(tenantApply.request.params.keys()).toEqual([]);
    expect(tenantApply.request.body).toEqual({ fingerprint: 'A'.repeat(64) });
    tenantApply.flush({ fingerprint: 'A'.repeat(64), canApply: true, hasPending: false, changes: [] });

    api.tenantNavigationReadiness().subscribe();
    const nav = http.expectOne(environment.apiUrl + '/system/FeatureRegistry/tenant-navigation/readiness');
    expect(nav.request.method).toBe('GET');
    expect(nav.request.params.keys()).toEqual([]);
    nav.flush({ readyForDynamicPilot: false, requiredRoutes: 6, readyRoutes: 0, routes: [],
      unregisteredTenantRoutes: [], ungatedExternalMenuCount: 0 });

    api.systemEndpointIntegrity().subscribe();
    const integrity = http.expectOne(environment.apiUrl + '/system/FeatureRegistry/system-endpoints/integrity');
    expect(integrity.request.method).toBe('GET');
    expect(integrity.request.params.keys()).toEqual([]);
    integrity.flush({ readyForGranularEnforcement: false, discoveredFeatureEndpoints: 1,
      readyFeatureEndpoints: 0, endpoints: [], uncatalogedSystemAdminRoutes: [],
      unreviewedActiveSystemApiKeys: [], reviewedInternalSystemRoutes: 0, outOfScopeRouteCount: 0 });

    api.centralAccessReadiness().subscribe();
    const aggregate = http.expectOne(
      environment.apiUrl + '/system/FeatureRegistry/central-access/readiness');
    expect(aggregate.request.method).toBe('GET');
    expect(aggregate.request.params.keys()).toEqual([]);
    expect(aggregate.request.body).toBeNull();
    aggregate.flush({ centralCatalogConsistent: false,
      blockingChecks: ['tenant_navigation_not_ready'],
      systemRegistry: { ready: true, conflicts: 0, pending: 0, observed: 81,
        fingerprint: 'A'.repeat(64) },
      tenantPermissionCatalog: { ready: true, conflicts: 0, pending: 0, observed: 53,
        fingerprint: 'A'.repeat(64) },
      tenantNavigation: { ready: false, conflicts: 6, pending: 6, observed: 6,
        fingerprint: null },
      systemEndpoints: { ready: false, conflicts: 1, pending: 1, observed: 1,
        fingerprint: null } });

    api.apply('B'.repeat(64)).subscribe();
    const apply = http.expectOne(environment.apiUrl + '/system/FeatureRegistry/apply');
    expect(apply.request.method).toBe('POST');
    expect(apply.request.params.keys()).toEqual([]);
    expect(apply.request.body).toEqual({ fingerprint: 'B'.repeat(64) });
    apply.flush({ fingerprint: 'B'.repeat(64), canApply: true, hasPending: false, changes: [] });
    http.verify();
  });
});
