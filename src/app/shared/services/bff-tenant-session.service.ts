import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, switchMap, tap, finalize, throwError } from 'rxjs';
import type { BffSessionResponse } from '../models/bff-session.contract';

/** Safe, local Tenant navigation target. Never accept an absolute or protocol-relative URL. */
export function bffTenantLoginHref(returnUrl: string): string {
  const candidate = typeof returnUrl === 'string' ? returnUrl : '';
  const valid = /^\/dashboard(?:[/?#]|$)/.test(candidate) &&
    !candidate.startsWith('//') &&
    !candidate.includes('\\') &&
    !candidate.includes('..') &&
    !/%(?:2f|5c|2e|25)/i.test(candidate) &&
    !/[\r\n]/.test(candidate);
  return '/bff/auth/login?returnUrl=' +
    encodeURIComponent(valid ? candidate : '/dashboard');
}

/**
 * The server alone owns the OAuth tokens and opaque BFF session ticket.
 * This service never reads or writes localStorage and never handles JWTs.
 * /bff/session is live checked; the snapshot is UX-only, not authorization.
 */
@Injectable({ providedIn: 'root' })
export class BffTenantSessionService {
  private readonly http = inject(HttpClient);
  readonly session = signal<BffSessionResponse | null>(null);

  load(): Observable<BffSessionResponse> {
    return this.http.get<BffSessionResponse>('/bff/session', {
      withCredentials: true,
    }).pipe(tap(value => {
      if (!value?.authenticated || value.context?.type !== 'tenant' ||
          !value.context.tenantId || !value.context.tenantSlug ||
          !value.user?.id) {
        this.session.set(null);
        throw new Error('Invalid Tenant BFF session contract.');
      }
      this.session.set(value);
    }), catchError(error => {
      this.session.set(null);
      return throwError(() => error);
    }));
  }

  login(returnUrl: string): void {
    window.location.assign(bffTenantLoginHref(returnUrl));
  }

  /** Same-origin GET creates the readable request token, not an OAuth token. */
  csrfToken(): Observable<string> {
    return this.http.get<void>('/bff/auth/csrf', { withCredentials: true }).pipe(
      map(() => {
        const match = document.cookie.split(';').map(s => s.trim())
          .find(s => s.startsWith('XSRF-TOKEN='));
        if (!match) throw new Error('BFF anti-forgery token missing.');
        const value = decodeURIComponent(match.slice('XSRF-TOKEN='.length));
        if (!value) throw new Error('BFF anti-forgery token empty.');
        return value;
      }),
    );
  }

  /** Local state is cleared even on network failures; never claim server logout succeeded. */
  logout(): Observable<void> {
    return this.csrfToken().pipe(
      switchMap(token => this.http.post<void>('/bff/auth/logout', {}, {
        withCredentials: true,
        headers: new HttpHeaders({ 'X-XSRF-TOKEN': token }),
      })),
      finalize(() => this.session.set(null)),
    );
  }

  clear(): void {
    this.session.set(null);
  }
}
