import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TokenStorageService } from '../services/token-storage.service';
import { BffTenantSessionService } from '../services/bff-tenant-session.service';

/** Attach credentials only to Shinera API calls; never leak tokens to arbitrary URLs. */
export const apiAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const storage = inject(TokenStorageService);
  const router = inject(Router);
  const apiBase = environment.apiUrl.replace(/\/$/, '');
  // Invitation redemption uses only its short-lived one-time token and a
  // NEW password; never append OAuth Bearer or browser cookies, and never
  // send it to a different origin. This must precede BFF branch handling.
  if (/\/public\/tenant-invitations\/activate(?:[/?]|$)/i.test(request.url)) {
    const api = new URL(apiBase, window.location.origin);
    const target = new URL(request.url, window.location.origin);
    if (api.origin !== window.location.origin ||
        target.origin !== window.location.origin)
      return throwError(() => new Error(
        'Tenant invitation activation requires a same-origin HTTPS API proxy.',
      ));
    return next(request.clone({
      withCredentials: false,
      headers: request.headers.delete('Authorization'),
    }));
  }
  // The opt-in BFF client must NEVER attach an OAuth bearer or send the
  // browser's BFF cookie to a different origin. Backend keeps its native
  // bearer scheme for other endpoints and for the disabled pilot.
  if (environment.bffTenantPilotEnabled) {
    const target = new URL(request.url, window.location.origin);
    const api = new URL(apiBase, window.location.origin);
    const workspacePath = api.pathname.replace(/\/$/, '') + '/tenant/workspace';
    if (target.pathname === workspacePath ||
        target.pathname.startsWith(workspacePath + '/')) {
      if (api.origin !== window.location.origin ||
          target.origin !== window.location.origin ||
          !request.url.startsWith('/')) {
        return throwError(() => new Error(
          'BFF Tenant API pilot requires relative same-origin /api requests.',
        ));
      }
      const bff = inject(BffTenantSessionService);
      const clean = request.clone({
        withCredentials: true,
        headers: request.headers.delete('Authorization'),
      });
      const send = (prepared: typeof request) => next(prepared).pipe(
        catchError(error => {
          if (error.status === 401) bff.clear();
          return throwError(() => error);
        }),
      );
      if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method.toUpperCase()))
        return send(clean);
      return bff.csrfToken().pipe(
        switchMap(token => send(clean.clone({
          setHeaders: { 'X-XSRF-TOKEN': token },
        }))),
      );
    }
  }

  if (!request.url.startsWith(apiBase + '/')) return next(request);

  // Login, token refresh, CAPTCHA and revocation are anonymous OAuth endpoints.
  // Attaching a stale access token here could poison reauthentication.
  const anonymous = /\/system\/Auth\/(login|interactive-login|interactive-first-login\/complete|csrf|captcha\/new|captcha\/image|revoke)(?:[/?]|$)/i
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
