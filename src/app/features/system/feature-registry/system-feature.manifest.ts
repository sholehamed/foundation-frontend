/**
 * Code-owned Angular entry points. Stable keys must match the reviewed
 * Foundation Backend FeatureRegistryDefinitions catalog.
 * This is a build-time route index; it never loads components from DB values.
 */
export const systemFeatureManifest = {
  roles: {
    key: 'system.roles',
    segment: 'roles',
    route: '/system/roles',
    permissionCode: 'ROLES.READ',
  },
  permissions: {
    key: 'system.permissions',
    segment: 'permissions',
    route: '/system/permissions',
    permissionCode: 'PERMISSIONS.READ',
  },
} as const;
