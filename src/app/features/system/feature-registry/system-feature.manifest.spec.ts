import routes from '../system.routes';
import { systemFeatureManifest } from './system-feature.manifest';

describe('System feature manifest and Angular route alignment', () => {
  it('binds every code-owned UI feature to a real Angular System route', () => {
    const root = routes.find(x => x.path === '');
    const children = root?.children ?? [];
    const features = Object.values(systemFeatureManifest);

    expect(new Set(features.map(x => x.key)).size).toBe(features.length);
    expect(new Set(features.map(x => x.route)).size).toBe(features.length);

    for (const feature of features) {
      expect(feature.route).toBe('/system/' + feature.segment);
      const route = children.find(x => x.path === feature.segment);
      expect(route).toBeDefined();
      expect(route?.data?.['featureKey']).toBe(feature.key);
      expect(route?.data?.['permissionCode']).toBe(feature.permissionCode);
      expect(route?.loadChildren || route?.loadComponent).toBeTruthy();
    }

    expect(children.some(x => x.path === 'feature-registry')).toBe(true);
  });
});
