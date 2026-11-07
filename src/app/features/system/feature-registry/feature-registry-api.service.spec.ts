import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { FeatureRegistryApiService } from './feature-registry-api.service';

describe('FeatureRegistryApiService admin-only contract', () => {
  it('uses fixed preview/apply routes and sends no role or tenant IDs', () => {
    TestBed.configureTestingModule({
      providers: [FeatureRegistryApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    const api = TestBed.inject(FeatureRegistryApiService);
    const http = TestBed.inject(HttpTestingController);

    api.preview().subscribe();
    const preview = http.expectOne(environment.apiUrl + '/system/FeatureRegistry/preview');
    expect(preview.request.method).toBe('GET');
    expect(preview.request.params.keys()).toEqual([]);
    preview.flush({ canApply: true, hasPending: false, changes: [] });

    api.apply().subscribe();
    const apply = http.expectOne(environment.apiUrl + '/system/FeatureRegistry/apply');
    expect(apply.request.method).toBe('POST');
    expect(apply.request.params.keys()).toEqual([]);
    expect(apply.request.body).toEqual({});
    apply.flush({ canApply: true, hasPending: false, changes: [] });
    http.verify();
  });
});
