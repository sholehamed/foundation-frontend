import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import {
  TenantDirectoryKind, TenantPermissionKeys, TenantWorkspaceService,
} from '../../features/app/tenant-workspace.service';

/** Per-page live UI guard; backend independently enforces each directory read. */
export const tenantOwnerDirectoryGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const kind: unknown = route.data['directoryKind'];
  if (kind !== 'members' && kind !== 'roles' && kind !== 'groups') {
    return router.parseUrl('/dashboard');
  }
  const page = kind as TenantDirectoryKind;
  const expectedKey = TenantPermissionKeys[page];
  const expectedRoute = '/dashboard/' + page;
  return inject(TenantWorkspaceService).getUiAccess().pipe(
    map(snapshot => Array.isArray(snapshot?.entries) &&
      snapshot.entries.some(item => item.key === expectedKey &&
        item.kind === 'PAGE' && item.route === expectedRoute &&
        item.allowed === true)
      ? true : router.parseUrl('/dashboard')),
    catchError(() => of(router.parseUrl('/dashboard'))),
  );
};
