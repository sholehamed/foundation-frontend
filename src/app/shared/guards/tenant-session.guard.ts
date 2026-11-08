import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenStorageService } from '../services/token-storage.service';
import { BffTenantSessionService } from '../services/bff-tenant-session.service';
import { isTenantWorkspaceHost } from '../util/tenant-workspace-host';
import type { BffSessionResponse } from '../models/bff-session.contract';

/** Publicly testable, conservative UX check. Never a server authorization source. */
export function bffSessionMatchesTenantHost(
  session: BffSessionResponse, hostname: string, baseDomain: string,
): boolean {
  if (!isTenantWorkspaceHost(hostname, baseDomain)) return false;
  const host = hostname.toLowerCase().replace(/\.$/, '');
  const suffix = '.' + baseDomain.toLowerCase().replace(/\.$/, '');
  const expectedSlug = host.slice(0, -suffix.length);
  return session.authenticated === true &&
    session.context.type === 'tenant' &&
    !!session.user?.id &&
    !!session.context.tenantId &&
    session.context.tenantSlug?.toLowerCase() === expectedSlug;
}

/** Navigation UX only; live Tenant authorization always belongs to .NET. */
export const tenantSessionGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  const host = window.location.hostname.toLowerCase();
  const suffix = '.' + environment.workspaceBaseDomain.toLowerCase();
  const slug = host.endsWith(suffix) ? host.slice(0, -suffix.length) : null;
  const login = () => router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });

  if (environment.bffTenantPilotEnabled) {
    // Never fall back to a JS bearer token when a cookie session is missing.
    if (!slug || !isTenantWorkspaceHost(host, environment.workspaceBaseDomain))
      return login();

    return inject(BffTenantSessionService).load().pipe(
      map(session => bffSessionMatchesTenantHost(
        session, host, environment.workspaceBaseDomain)
        ? true : router.parseUrl('/auth/access-denied')),
      catchError(error => of(error.status === 401 ? login()
        : router.parseUrl('/auth/access-denied'))),
    );
  }

  const storage = inject(TokenStorageService);
  if (slug && storage.getAccessToken() &&
      storage.getAccountType() === 'tenant' &&
      storage.getUsertenant()?.toLowerCase() === slug) {
    return true;
  }
  return login();
};
