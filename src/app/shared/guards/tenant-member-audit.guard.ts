import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { TenantWorkspaceService } from '../../features/app/tenant-workspace.service';

/** Client-side convenience only; the SQL-backed endpoint independently checks Owner. */
export const tenantMemberAuditGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(TenantWorkspaceService).getAdminCapabilities().pipe(
    map(cap => cap?.canViewMemberAudit === true
      ? true : router.parseUrl('/dashboard/members')),
    catchError(() => of(router.parseUrl('/dashboard/members'))),
  );
};
