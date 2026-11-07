import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BackendFeatureManifest } from './feature-registry-contract';

export type FeatureRegistryStatus = 'Create' | 'Present' | 'UpdateRoute' | 'Conflict';

export interface FeatureRegistryChange {
  type: string;
  key: string;
  state: FeatureRegistryStatus;
  detail: string | null;
}

export interface FeatureRegistryPreview {
  canApply: boolean;
  hasPending: boolean;
  changes: FeatureRegistryChange[];
}

@Injectable({ providedIn: 'root' })
export class FeatureRegistryApiService {
  private readonly http = inject(HttpClient);
  private readonly root = environment.apiUrl + '/system/FeatureRegistry';

  /** Source-owned feature keys and access rules from the Backend. */
  manifest(): Observable<BackendFeatureManifest> {
    return this.http.get<BackendFeatureManifest>(this.root + '/manifest');
  }

  preview(): Observable<FeatureRegistryPreview> {
    return this.http.get<FeatureRegistryPreview>(this.root + '/preview');
  }

  /** The backend requires SystemAdministrator + an explicit deployment flag. */
  apply(): Observable<FeatureRegistryPreview> {
    return this.http.post<FeatureRegistryPreview>(this.root + '/apply', {});
  }
}
