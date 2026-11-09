import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { TenantWorkspaceService } from '../../features/app/tenant-workspace.service';

/** UX gate only; backend re-evaluates active Owner and all three PAGE grants. */
export const tenantGroupAuditGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(TenantWorkspaceService).getAdminCapabilities().pipe(
    map(cap => cap?.canViewGroupAudit === true
      ? true : router.parseUrl('/dashboard/groups')),
    catchError(() => of(router.parseUrl('/dashboard/groups'))),
  );
};
