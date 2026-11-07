import { BackendFeatureManifest, validateBackendFeatureManifest } from './feature-registry-contract';
import { discoverExecutableSystemChildRoutes } from './system-ui-route-discovery';
import { mockManifestForRoutes } from './registry-manifest.test-fixture';

describe('Feature Registry v2 backend-owned UI manifest compatibility', () => {
  let pages: string[];
  let valid: BackendFeatureManifest;

  beforeAll(async () => {
    pages = await discoverExecutableSystemChildRoutes();
    valid = mockManifestForRoutes(pages);
  });

  it('accepts exact live Angular root and nested routes, plus route-less actions', () => {
    expect(validateBackendFeatureManifest(valid, undefined, pages)).toEqual([]);
  });

  it('blocks missing root/child pages, extra routes and unsupported schema versions', () => {
    const missingRoot = { ...valid, features: valid.features.slice(0, -1) };
    expect(validateBackendFeatureManifest(missingRoot, undefined, pages).length).toBeGreaterThan(0);

    const missingChild = { ...valid, uiElements: valid.uiElements.slice(1) };
    expect(validateBackendFeatureManifest(missingChild, undefined, pages).join(' '))
      .toContain(pages[0]);

    const extraChild = { ...valid, uiElements: [...valid.uiElements,
      { featureKey: 'system.roles', key: 'system.roles.unreleased', type: 'PAGE' as const,
        route: '/system/roles/not-in-angular', permissionCode: 'ROLES.READ', defaultActive: true }] };
    expect(validateBackendFeatureManifest(extraChild, undefined, pages).join(' '))
      .toContain('/system/roles/not-in-angular');

    const oldVersion = { ...valid, schemaVersion: 1 };
    expect(validateBackendFeatureManifest(oldVersion, undefined, pages)).not.toEqual([]);
    const futureVersion = { ...valid, schemaVersion: 3 };
    expect(validateBackendFeatureManifest(futureVersion, undefined, pages)).not.toEqual([]);
  });

  it('blocks duplicate keys, wrong owners/types/actions and malformed permission codes', () => {
    const duplicated = { ...valid, uiElements: [
      valid.uiElements[0],
      { ...valid.uiElements[1], key: valid.uiElements[0].key },
      ...valid.uiElements.slice(2),
    ] };
    expect(validateBackendFeatureManifest(duplicated, undefined, pages)).not.toEqual([]);

    const wrongPermission = { ...valid, uiElements: valid.uiElements.map((x, i) => i === 0 ?
      { ...x, permissionCode: 'GROUPS.WRITE' } : x) };
    expect(validateBackendFeatureManifest(wrongPermission, undefined, pages)).not.toEqual([]);

    const actionWithUrl = { ...valid, uiElements: valid.uiElements.map(x => x.type === 'ACTION'
      ? { ...x, route: '/system/feature-registry/apply' } : x) };
    expect(validateBackendFeatureManifest(actionWithUrl, undefined, pages)).not.toEqual([]);

    const duplicateRoute = { ...valid, uiElements: valid.uiElements.map((x, i) =>
      i === 1 ? { ...x, route: valid.uiElements[0].route } : x) };
    expect(validateBackendFeatureManifest(duplicateRoute, undefined, pages)).not.toEqual([]);
  });
});
