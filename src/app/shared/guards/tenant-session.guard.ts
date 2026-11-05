import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TokenStorageService } from '../services/token-storage.service';

/** Client navigation convenience only. Server enforces membership and tenant write scopes. */
export const tenantSessionGuard: CanActivateFn = (_route, state) => {
  const storage = inject(TokenStorageService);
  const suffix = '.' + environment.workspaceBaseDomain.toLowerCase();
  const host = window.location.hostname.toLowerCase();
  const slug = host.endsWith(suffix) ? host.slice(0, -suffix.length) : null;
  if (slug && storage.getAccessToken() &&
      storage.getAccountType() === 'tenant' &&
      storage.getUsertenant()?.toLowerCase() === slug) {
    return true;
  }
  return inject(Router).createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
};
