import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TenantPermissionKeys, TenantWorkspaceService } from './tenant-workspace.service';

/** Independent rollout gate plus live PAGE decision; backend rechecks owner. */
export const tenantNavigationOwnerEditorGuard: CanActivateFn = () => {
  const router = inject(Router);
  if (!environment.tenantNavigationEditorPilotEnabled) {
    return router.parseUrl('/dashboard');
  }
  return inject(TenantWorkspaceService).getUiAccess().pipe(
    map(snapshot => Array.isArray(snapshot?.entries) &&
      snapshot.entries.some(x => x.kind === 'PAGE' &&
        x.key === TenantPermissionKeys.navigationRead &&
        x.route === '/dashboard/navigation' && x.allowed === true)
      ? true : router.parseUrl('/dashboard')),
    catchError(() => of(router.parseUrl('/dashboard'))),
  );
};
