import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TokenStorageService } from '../services/token-storage.service';

/** Attach credentials only to Shinera API calls; never leak tokens to arbitrary URLs. */
export const apiAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const storage = inject(TokenStorageService);
  const router = inject(Router);
  const apiBase = environment.apiUrl.replace(/\/$/, '');
  if (!request.url.startsWith(apiBase + '/')) return next(request);

  // Login, token refresh, CAPTCHA and revocation are anonymous OAuth endpoints.
  // Attaching a stale access token here could poison reauthentication.
  const anonymous = /\/system\/Auth\/(login|captcha\/new|captcha\/image|revoke)(?:[/?]|$)/i
    .test(request.url);
  const token = anonymous ? null : storage.getAccessToken();
  const authorized = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorized).pipe(
    catchError(error => {
      if (!anonymous && error.status === 401 && token) {
        const context = storage.getAccountType();
        storage.clear();
        if (context === 'system' && router.url.startsWith('/system/') &&
            !router.url.startsWith('/system/auth/')) {
          void router.navigate(['/system/auth/login'], {
            queryParams: { returnUrl: router.url },
            replaceUrl: true,
          });
        }
      }
      return throwError(() => error);
    }),
  );
};
