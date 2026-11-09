import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { TenantPermissionKeys, TenantWorkspaceService } from '../../features/app/tenant-workspace.service';

/** UX-only PAGE gate. Backend independently checks both read permissions. */
export const tenantGroupMembersGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(TenantWorkspaceService).getUiAccess().pipe(
    map(snapshot => {
      const entries = snapshot?.entries;
      if (!Array.isArray(entries)) return router.parseUrl('/dashboard/groups');
      const pages = [
        [TenantPermissionKeys.groups, '/dashboard/groups'],
        [TenantPermissionKeys.members, '/dashboard/members'],
      ] as const;
      return pages.every(([key, route]) => entries.some(item =>
        item.key === key && item.kind === 'PAGE' &&
        item.route === route && item.allowed === true))
        ? true : router.parseUrl('/dashboard/groups');
    }),
    catchError(() => of(router.parseUrl('/dashboard/groups'))),
  );
};
