import type { Route, Routes } from '@angular/router';
import systemRoutes from '../system.routes';
import { systemFeatureRoutes } from './system-feature.manifest';

/**
 * Discover executable PAGE URLs directly from the Angular route definitions.
 * No second hand-authored list of child paths is maintained in production.
 *
 * Only called on the System Registry admin page / in contract tests. Lazy
 * route configuration modules are loaded on demand, not their components.
 * Containers, redirects and catch-all routes are not executable child pages.
 */
export async function discoverExecutableSystemChildRoutes(): Promise<string[]> {
  const layout = systemRoutes.find(route =>
    route.path === '' && !!route.children);
  if (!layout?.children) {
    throw new Error('System layout route is missing');
  }

  const pageRoutes = new Set<string>();
  const knownRoots = new Set<string>(systemFeatureRoutes);

  const walk = async (routes: Routes, base: string): Promise<void> => {
    for (const route of routes) {
      if (route.path === '**' || route.redirectTo !== undefined ||
          route.matcher || typeof route.path !== 'string') {
        continue;
      }
      const full = [base.replace(/\/$/, ''), route.path]
        .filter(Boolean).join('/').replace(/\/+/g, '/');

      let nested: Routes = route.children ?? [];
      if (route.loadChildren) {
        const value = await route.loadChildren();
        // Angular Router unwraps default exports from dynamic imports.
        // Mirror that behavior: most Foundation lazy route files use
        // `loadChildren: () => import('./children.routes')`.
        const unwrapped = Array.isArray(value) ? value :
          value && typeof value === 'object' && 'default' in value
            ? value.default : null;
        if (!Array.isArray(unwrapped)) {
          throw new Error('System child route is not a static Routes array: ' + full);
        }
        nested = unwrapped;
      }

      // Layout components with actual child pages are containers, not
      // independent pages. A root page is stored in FeatureRegistry.Features.
      if (nested.length === 0 &&
          (route.loadComponent || route.component) &&
          !knownRoots.has(full)) {
        pageRoutes.add(full);
      }
      if (nested.length > 0) {
        await walk(nested, full);
      }
    }
  };

  await walk(layout.children, '/system');
  return [...pageRoutes].sort();
}
