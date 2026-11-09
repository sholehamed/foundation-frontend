import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { TenantWorkspaceService } from '../../features/app/tenant-workspace.service';

/** Fail-closed UX only: backend independently enforces live Owner and all PAGEs. */
export const tenantMemberEffectivePermissionsGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(TenantWorkspaceService).getAdminCapabilities().pipe(
    map(cap => cap?.canViewMemberEffectivePermissions === true
      ? true : router.parseUrl('/dashboard/members')),
    catchError(() => of(router.parseUrl('/dashboard/members'))),
  );
};
