import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStorageService } from '../services/token-storage.service';

/** Navigation guard only; API enforces live DB-backed System authorization. */
export const systemSessionGuard: CanActivateFn = (_route, state) => {
  const storage = inject(TokenStorageService);
  if (storage.getAccessToken() && storage.getAccountType() === 'system')
    return true;

  return inject(Router).createUrlTree(['/system/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
};
