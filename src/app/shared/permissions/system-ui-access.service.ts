import { HttpClient } from '@angular/common/http';
import { DestroyRef, inject, Injectable } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { catchError, filter, map, Observable, of, shareReplay, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';

export interface CurrentUiAccessEntry {
  key: string;
  route: string | null;
  type: 'PAGE' | 'ACTION';
  allowed: boolean;
}

export interface CurrentUiAccessSnapshot {
  schemaVersion: number;
  entries: CurrentUiAccessEntry[];
}

export function isAuthorizedUiSnapshot(value: CurrentUiAccessSnapshot | null): value is CurrentUiAccessSnapshot {
  if (value?.schemaVersion !== 2 || !Array.isArray(value.entries)) return false;
  const keys = new Set<string>();
  const routes = new Set<string>();
  for (const entry of value.entries) {
    if (!entry || typeof entry.key !== 'string' || entry.key.length === 0 ||
        keys.has(entry.key.toLowerCase()) || typeof entry.allowed !== 'boolean' ||
        !['PAGE', 'ACTION'].includes(entry.type)) return false;
    keys.add(entry.key.toLowerCase());
    if (entry.type === 'PAGE') {
      if (!entry.route || !entry.route.startsWith('/system/') || routes.has(entry.route)) return false;
      routes.add(entry.route);
    } else if (entry.route !== null) return false;
  }
  return true;
}

export function isRouteAllowed(
  snapshot: CurrentUiAccessSnapshot | null, routeTemplate: string,
): boolean {
  if (!isAuthorizedUiSnapshot(snapshot)) return false;
  const pages = snapshot.entries.filter(entry =>
    entry.type === 'PAGE' && entry.route === routeTemplate);
  return pages.length === 1 && pages[0].allowed === true;
}

export function isKeyAllowed(
  snapshot: CurrentUiAccessSnapshot | null, key: string,
): boolean {
  if (!isAuthorizedUiSnapshot(snapshot)) return false;
  const entry = snapshot.entries.find(item => item.key === key);
  return entry?.allowed === true;
}

/**
 * One live projection for the current router navigation and its controls,
 * NOT a JWT claim or a long-lived permissions cache. A new navigation
 * invalidates the previous observable; high-impact actions must call
 * refreshAction() at click time. API authorization stays server-side.
 */
@Injectable({ providedIn: 'root' })
export class SystemUiAccessService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly url = environment.apiUrl.replace(/\/$/, '') + '/system/UiAccess/me';
  private currentRequest?: Observable<CurrentUiAccessSnapshot | null>;

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationStart => event instanceof NavigationStart),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => { this.currentRequest = undefined; });
  }

  private request(): Observable<CurrentUiAccessSnapshot | null> {
    return this.http.get<CurrentUiAccessSnapshot>(this.url).pipe(
      map(value => isAuthorizedUiSnapshot(value) ? value : null),
      catchError(() => of(null)),
    );
  }

  snapshot(): Observable<CurrentUiAccessSnapshot | null> {
    if (!this.currentRequest) {
      this.currentRequest = this.request().pipe(
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.currentRequest;
  }

  canAccess(key: string): Observable<boolean> {
    if (!/^[a-z0-9.-]+$/.test(key)) return of(false);
    return this.snapshot().pipe(map(snapshot => isKeyAllowed(snapshot, key)));
  }

  canAccessRoute(routeTemplate: string): Observable<boolean> {
    if (!routeTemplate.startsWith('/system/')) return of(false);
    return this.snapshot().pipe(map(snapshot => isRouteAllowed(snapshot, routeTemplate)));
  }

  /** Never submit a sensitive write based on a previous navigation snapshot. */
  refreshAction(key: string): Observable<boolean> {
    if (!/^[a-z0-9.-]+$/.test(key)) return of(false);
    return this.request().pipe(
      tap(snapshot => { this.currentRequest = of(snapshot); }),
      map(snapshot => isKeyAllowed(snapshot, key)),
    );
  }
}
