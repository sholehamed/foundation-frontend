import routes from '../system.routes';
import { systemFeatureRouteSegments, systemFeatureRoutes } from './system-feature.manifest';

describe('System Angular route index', () => {
  it('binds route-only entries to actual lazy components without duplicating Backend permission keys', () => {
    const root = routes.find(x => x.path === '');
    const children = root?.children ?? [];
    const segments = Object.values(systemFeatureRouteSegments);
    expect(segments).toHaveLength(15);
    expect(new Set(segments).size).toBe(segments.length);
    expect(systemFeatureRoutes).toEqual(segments.map(x => '/system/' + x));
    // Every executable System root page must be registered: no untracked
    // admin page may bypass deployment compatibility checks.
    expect(children.filter(x => x.path !== '').map(x => x.path).sort())
      .toEqual([...segments].sort());

    for (const segment of segments) {
      const route = children.find(x => x.path === segment);
      expect(route).toBeDefined();
      expect(route?.loadChildren || route?.loadComponent).toBeTruthy();
      // Stable Feature.Key and read Permission.Code are owned by the backend.
      expect(route?.data?.['featureKey']).toBeUndefined();
      expect(route?.data?.['permissionCode']).toBeUndefined();
    }
    expect(children.some(x => x.path === 'feature-registry')).toBe(true);
    expect(children.some(x => x.path === 'control-tower' && !!x.loadComponent)).toBe(true);
  });
});
