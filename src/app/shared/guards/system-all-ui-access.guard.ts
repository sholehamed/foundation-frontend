import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChildFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { SystemUiAccessService } from '../permissions/system-ui-access.service';
import { SYSTEM_UI_ACCESS_PILOT_ENABLED } from '../permissions/system-ui-access-pilot.token';

/** The route template, not the expanded GUID, is the code-owned UI identity. */
export function systemRouteTemplate(route: ActivatedRouteSnapshot): string {
  return '/' + route.pathFromRoot
    .map(node => node.routeConfig?.path ?? '')
    .filter(Boolean)
    .join('/');
}

/**
 * Covers every executable System root and nested PAGE. Container/lazy routes
 * aren't independently executable leaves; their child component is checked.
 * All 45 PAGE routes (including disabled Admin/User forms) fail closed when
 * the reviewed rollout flag is ON. Auth/login and denial pages are outside
 * the protected layout to prevent recursive redirection.
 */
export const systemAllUiAccessGuard: CanActivateChildFn = (route) => {
  if (!inject(SYSTEM_UI_ACCESS_PILOT_ENABLED)) return true;
  const config = route.routeConfig;
  if (!config || config.redirectTo !== undefined ||
      config.loadChildren || (config.children?.length ?? 0) > 0) return true;

  const router = inject(Router);
  const denied = router.parseUrl('/system/access-denied');

  if (!config.component && !config.loadComponent) return denied;
  const template = systemRouteTemplate(route);
  if (!template.startsWith('/system/')) return denied;

  return inject(SystemUiAccessService).canAccessRoute(template).pipe(
    map(allowed => allowed ? true : denied),
  );
};
