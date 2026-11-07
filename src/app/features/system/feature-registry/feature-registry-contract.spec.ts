import { BackendFeatureManifest, validateBackendFeatureManifest } from './feature-registry-contract';

export const validFeatureContract: BackendFeatureManifest = {
  schemaVersion: 1,
  features: [
    { key: 'system.users', pageKey: 'system.users', moduleCode: 'system',
      resourceCode: 'users', route: '/system/users', readPermission: 'USERS.READ' },
    { key: 'system.roles', pageKey: 'system.roles', moduleCode: 'system',
      resourceCode: 'roles', route: '/system/roles', readPermission: 'ROLES.READ' },
    { key: 'system.permissions', pageKey: 'system.permissions', moduleCode: 'system',
      resourceCode: 'permissions', route: '/system/permissions', readPermission: 'PERMISSIONS.READ' },
  ],
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
      { ...validFeatureContract.features[0], key: 'system.groups',
        pageKey: 'system.groups', route: '/system/groups', readPermission: 'GROUPS.READ' }] };
    expect(validateBackendFeatureManifest(extra).join(' ')).toContain('/system/groups');
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
