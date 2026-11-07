import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { SystemUiAccessService } from '../permissions/system-ui-access.service';
import { SYSTEM_UI_ACCESS_PILOT_ENABLED } from '../permissions/system-ui-access-pilot.token';

/**
 * This pilot guards only explicitly tagged routes. The default-OFF switch
 * prevents a rollout before the reviewed Registry + Master grants are ready.
 * An activated guard denies unknown keys, API failure and revoked grants.
 * API endpoints MUST still enforce their own authorization.
 */
export const systemUiAccessGuard: CanActivateFn = (route) => {
  const enabled = inject(SYSTEM_UI_ACCESS_PILOT_ENABLED);
  if (!enabled) return true;

  const router = inject(Router);
  const deny = () => router.createUrlTree(['/system/dashboard'], {
    queryParams: { accessDenied: '1' },
  });

  const key = route.data['uiAccessKey'];
  if (typeof key !== 'string' || !key.startsWith('system.')) return deny();

  return inject(SystemUiAccessService).canAccess(key).pipe(
    map(allowed => allowed ? true : deny()),
  );
};
