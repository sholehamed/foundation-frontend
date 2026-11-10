/**
 * Executable Angular route segments only.
 *
 * Backend /system/FeatureRegistry/manifest owns ALL stable feature keys,
 * Permission.Code and resource metadata. Keeping only the Angular segments
 * here prevents duplicated business permission declarations across repos.
 * A runtime compatibility check refuses admin Apply on route drift.
 */
export const systemFeatureRouteSegments = {
  admins: 'admins',
  users: 'users',
  roles: 'roles',
  groups: 'groups',
  dashboard: 'dashboard',
  tenants: 'tenants',
  modules: 'modules',
  permissions: 'permissions',
  apiResources: 'api-resources',
  uiResources: 'ui-resources',
  resources: 'resources',
  featureRegistry: 'feature-registry',
  menuManagement: 'menu-management',
  planCatalog: 'plan-catalog',
} as const;

export const systemFeatureRoutes = Object.values(systemFeatureRouteSegments)
  .map(segment => '/system/' + segment);
