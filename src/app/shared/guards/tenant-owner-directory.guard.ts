import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { TenantWorkspaceService } from '../../features/app/tenant-workspace.service';

/** UX guard only; all directory APIs recheck live Owner role. */
export const tenantOwnerDirectoryGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(TenantWorkspaceService).getAdminCapabilities().pipe(
    map(cap => cap?.canViewAdministration === true ? true : router.parseUrl('/dashboard')),
    catchError(() => of(router.parseUrl('/dashboard'))),
  );
};
