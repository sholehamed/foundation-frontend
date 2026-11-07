import { systemFeatureRoutes } from './system-feature.manifest';

export interface BackendFeatureDefinition {
  key: string;
  moduleCode: string;
  resourceCode: string;
  route: string;
  pageKey: string;
  readPermission: string;
}

export interface BackendUiElement {
  featureKey: string;
  key: string;
  route: string | null;
  type: 'PAGE' | 'ACTION';
  permissionCode: string;
  defaultActive: boolean;
}

export interface BackendFeatureManifest {
  schemaVersion: number;
  features: BackendFeatureDefinition[];
  uiElements: BackendUiElement[];
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
  childRoutes: readonly string[] = [],
): string[] {
  const errors: string[] = [];
  if (manifest?.schemaVersion !== 2 ||
      !Array.isArray(manifest?.features) ||
      !Array.isArray(manifest?.uiElements)) {
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
  const elementKeys = new Set<string>();
  const pageRoutes = new Set<string>();
  for (const element of manifest.uiElements) {
    const key = element?.key?.toLowerCase();
    const parentKey = element?.featureKey?.toLowerCase();
    const parent = manifest.features.find(x => x.key?.toLowerCase() === parentKey);

    if (!key || elementKeys.has(key)) {
      errors.push('کلید UiResource تکراری یا نامعتبر است: ' + (element?.key ?? ''));
    } else {
      elementKeys.add(key);
    }
    if (!parent || !key?.startsWith(parentKey + '.') ||
        !element?.permissionCode?.startsWith(parent.resourceCode.toUpperCase() + '.') ||
        !/^[A-Z][A-Z0-9-]*\.[A-Z0-9-]+$/.test(element?.permissionCode ?? '') ||
        typeof element?.defaultActive !== 'boolean') {
      errors.push('مجوز یا مالکیت UiResource نامعتبر است: ' + (element?.key ?? ''));
    }

    if (element?.type === 'PAGE') {
      if (!element.route || !element.route.startsWith('/system/') ||
          element.route.includes('..') || element.route.includes('//') ||
          element.route.includes('?') || element.route.includes('#') ||
          pageRoutes.has(element.route)) {
        errors.push('Route صفحه داخلی نامعتبر یا تکراری: ' + (element?.route ?? ''));
      } else {
        pageRoutes.add(element.route);
      }
    } else if (element?.type === 'ACTION') {
      if (element.route !== null) {
        errors.push('ACTION نباید Route اجرایی داشته باشد: ' + (element?.key ?? ''));
      }
    } else {
      errors.push('نوع UiResource ناشناخته است: ' + (element?.key ?? ''));
    }
  }

  const localPages = new Set(childRoutes);
  if (localPages.size !== childRoutes.length) {
    errors.push('صفحات داخلی Angular دارای مسیر تکراری هستند.');
  }
  for (const path of childRoutes) {
    if (!pageRoutes.has(path)) errors.push('صفحه داخلی در Backend نیست: ' + path);
  }
  for (const path of pageRoutes) {
    if (!localPages.has(path)) errors.push('صفحه داخلی در Angular نیست: ' + path);
  }
  return errors;
}
