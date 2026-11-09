import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

/**
 * FR-14B-3: new bounded System-only account lifecycle API. Never call the
 * legacy /Admins/:id PATCH or PUT handlers with raw user forms/passwords.
 */
export interface SystemAccountLifecycleView {
  id: string;
  userName: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  isLockedOut: boolean;
  version: string;
}

@Injectable({ providedIn: 'root' })
export class SystemAccountLifecycleService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl + '/system/Admins/';

  get(id: string): Observable<SystemAccountLifecycleView> {
    return this.http.get<SystemAccountLifecycleView>(
      this.base + encodeURIComponent(id) + '/lifecycle');
  }

  updateProfile(id: string, value: {
    firstName: string; lastName: string; email: string; expectedVersion: string;
  }): Observable<SystemAccountLifecycleView> {
    return this.http.put<SystemAccountLifecycleView>(
      this.base + encodeURIComponent(id) + '/profile', value);
  }

  setState(id: string, desired: boolean, expectedVersion: string):
      Observable<SystemAccountLifecycleView> {
    return this.http.put<SystemAccountLifecycleView>(
      this.base + encodeURIComponent(id) + '/state',
      { isActive: desired, expectedVersion });
  }

  setLock(id: string, desired: boolean, expectedVersion: string):
      Observable<SystemAccountLifecycleView> {
    return this.http.put<SystemAccountLifecycleView>(
      this.base + encodeURIComponent(id) + '/lock',
      { isLockedOut: desired, expectedVersion });
  }
}
