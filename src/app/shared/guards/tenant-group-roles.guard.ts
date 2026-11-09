import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { TenantPermissionKeys, TenantWorkspaceService } from '../../features/app/tenant-workspace.service';

/** UX PAGE guard; all Owner/ACTION and scoped target checks remain server-side. */
export const tenantGroupRolesGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(TenantWorkspaceService).getUiAccess().pipe(
    map(snapshot => {
      const entries = snapshot?.entries;
      if (!Array.isArray(entries)) return router.parseUrl('/dashboard/groups');
      const pages = [
        [TenantPermissionKeys.groups, '/dashboard/groups'],
        [TenantPermissionKeys.roles, '/dashboard/roles'],
      ] as const;
      return pages.every(([key, route]) => entries.some(item =>
        item.key === key && item.kind === 'PAGE' &&
        item.route === route && item.allowed === true))
        ? true : router.parseUrl('/dashboard/groups');
    }),
    catchError(() => of(router.parseUrl('/dashboard/groups'))),
  );
};
