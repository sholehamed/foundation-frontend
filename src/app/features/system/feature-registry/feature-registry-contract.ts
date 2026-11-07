import { systemFeatureRoutes } from './system-feature.manifest';

export interface BackendFeatureDefinition {
  key: string;
  moduleCode: string;
  resourceCode: string;
  route: string;
  pageKey: string;
  readPermission: string;
}

export interface BackendFeatureManifest {
  schemaVersion: number;
  features: BackendFeatureDefinition[];
}

/**
 * Deployment compatibility check, NOT client authorization.
 * The Backend is the single source for keys, permissions and resources.
 * Angular is the single source for executable components/routes.
 * Invalid/stale manifests must prevent UI Apply (server also enforces
 * SystemAdministrator + explicit opt-in setting for direct callers).
 */
export function validateBackendFeatureManifest(
  manifest: BackendFeatureManifest,
  routes: readonly string[] = systemFeatureRoutes,
): string[] {
  const errors: string[] = [];
  if (manifest?.schemaVersion !== 1 || !Array.isArray(manifest?.features)) {
    return ['نسخه قرارداد رجیستری ناسازگار است؛ Apply غیرفعال شد.'];
  }

  const seenKeys = new Set<string>();
  const seenRoutes = new Set<string>();
  for (const feature of manifest.features) {
    const key = feature?.key?.toLowerCase();
    const route = feature?.route;
    if (!key || seenKeys.has(key)) {
      errors.push('شناسه قابلیت نامعتبر یا تکراری: ' + (feature?.key ?? ''));
    } else {
      seenKeys.add(key);
    }

    if (!route || seenRoutes.has(route)) {
      errors.push('Route نامعتبر یا تکراری: ' + (route ?? ''));
    } else {
      seenRoutes.add(route);
    }

    if (feature?.moduleCode !== 'system' || feature?.pageKey !== feature?.key ||
        !feature?.resourceCode || !/^[A-Z][A-Z0-9-]*\.[A-Z0-9-]+$/.test(feature?.readPermission ?? '')) {
      errors.push('مشخصات دسترسی قابلیت معتبر نیست: ' + (feature?.key ?? ''));
    }
  }

  const uniqueLocalRoutes = new Set(routes);
  if (uniqueLocalRoutes.size !== routes.length) {
    errors.push('Routeهای محلی Angular تکراری هستند.');
  }
  for (const path of routes) {
    if (!seenRoutes.has(path)) {
      errors.push('این Route در Backend ثبت نشده است: ' + path);
    }
  }
  for (const path of seenRoutes) {
    if (!uniqueLocalRoutes.has(path)) {
      errors.push('این Route در نسخه Angular وجود ندارد: ' + path);
    }
  }
  return errors;
}
