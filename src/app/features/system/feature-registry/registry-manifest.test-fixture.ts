import type { BackendFeatureManifest } from './feature-registry-contract';
import { systemFeatureRoutes } from './system-feature.manifest';

/**
 * Unit-only fixture. A deployed manifest is ALWAYS requested from Backend;
 * these values do not become a production feature/permission catalog.
 */
export function mockManifestForRoutes(pageRoutes: readonly string[]): BackendFeatureManifest {
  const features = systemFeatureRoutes.map(route => {
    const resourceCode = route.slice('/system/'.length);
    return {
      key: 'system.' + resourceCode,
      pageKey: 'system.' + resourceCode,
      moduleCode: 'system',
      resourceCode,
      route,
      readPermission: resourceCode.toUpperCase() + '.READ',
    };
  });

  const uiElements = pageRoutes.map((route, index) => {
    const parts = route.split('/');
    let owner = parts[2];
    // Resource-scoped UI pages belong to the actual child feature, not the
    // parent Resource read permission; these test examples are read-only.
    if (owner === 'resources' && parts[4] === 'apiResources') owner = 'api-resources';
    if (owner === 'resources' && parts[4] === 'uiResources') owner = 'ui-resources';
    if (owner === 'resources' && parts[4] === 'permissions') owner = 'permissions';
    return {
      featureKey: 'system.' + owner,
      key: 'system.' + owner + '.test-' + index,
      route,
      type: 'PAGE' as const,
      permissionCode: owner.toUpperCase() + '.READ',
      defaultActive: true,
    };
  });

  return {
    schemaVersion: 2,
    features,
    uiElements: [...uiElements, {
      featureKey: 'system.feature-registry',
      key: 'system.feature-registry.action.apply',
      route: null,
      type: 'ACTION' as const,
      permissionCode: 'FEATURE-REGISTRY.APPLY',
      defaultActive: true,
    }],
  };
}
