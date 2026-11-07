import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CurrentUiAccessDecision {
  key: string;
  allowed: boolean;
}

/**
 * Always asks the Backend's live grant evaluator. No local JWT permission
 * snapshots, no cached decisions and no caller-controlled role/tenant IDs.
 * Fail closed on network, 401, 403 or invalid response.
 */
@Injectable({ providedIn: 'root' })
export class SystemUiAccessService {
  private readonly http = inject(HttpClient);
  private readonly root = environment.apiUrl.replace(/\/$/, '') + '/system/UiAccess/me/';

  canAccess(key: string): Observable<boolean> {
    if (!/^[a-z0-9.-]+$/.test(key)) return of(false);
    return this.http.get<CurrentUiAccessDecision>(
      this.root + encodeURIComponent(key),
    ).pipe(
      map(result => result?.key === key && result?.allowed === true),
      catchError(() => of(false)),
    );
  }
}
