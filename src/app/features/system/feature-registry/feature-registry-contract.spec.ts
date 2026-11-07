import { BackendFeatureManifest, validateBackendFeatureManifest } from './feature-registry-contract';
import { systemFeatureRoutes } from './system-feature.manifest';

export const validFeatureContract: BackendFeatureManifest = {
  schemaVersion: 1,
  // Mock the server contract. Production source code stores only executable
  // Angular segments; stable keys and permissions come from the Backend.
  features: systemFeatureRoutes.map(route => {
    const resourceCode = route.slice('/system/'.length);
    return {
      key: 'system.' + resourceCode,
      pageKey: 'system.' + resourceCode,
      moduleCode: 'system',
      resourceCode,
      route,
      readPermission: resourceCode.toUpperCase() + '.READ',
    };
  }),
};

describe('Feature Registry backend-owned manifest compatibility', () => {
  it('accepts supported server version matching all registered Angular feature paths', () => {
    expect(validateBackendFeatureManifest(validFeatureContract)).toEqual([]);
  });

  it('blocks backend-only, Angular-only and unsupported schema paths', () => {
    const older = { ...validFeatureContract, features: validFeatureContract.features.slice(0, 2) };
    expect(validateBackendFeatureManifest(older).join(' ')).toContain('/system/permissions');

    const future = { ...validFeatureContract, schemaVersion: 2 };
    expect(validateBackendFeatureManifest(future).length).toBeGreaterThan(0);

    const extra = { ...validFeatureContract, features: [...validFeatureContract.features,
      { ...validFeatureContract.features[0], key: 'system.audit',
        pageKey: 'system.audit', route: '/system/audit', readPermission: 'AUDIT.READ' }] };
    expect(validateBackendFeatureManifest(extra).join(' ')).toContain('/system/audit');
  });

  it('blocks duplicate stable keys and malformed read permission codes', () => {
    const duplicate = { ...validFeatureContract, features: [
      validFeatureContract.features[0], { ...validFeatureContract.features[1],
        key: 'system.users', pageKey: 'system.users', readPermission: 'bad name' },
      validFeatureContract.features[2],
    ] };
    expect(validateBackendFeatureManifest(duplicate).length).toBeGreaterThan(0);
    expect(validateBackendFeatureManifest({ schemaVersion: 1, features: [] }).length)
      .toBeGreaterThan(0);
  });
});
