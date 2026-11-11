import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { ControlTowerTraceService } from './control-tower-trace.service';

describe('ControlTowerTraceService — private System read boundary', () => {
  it('looks up an exact validated ID through Foundation only and never Tempo', () => {
    TestBed.configureTestingModule({ providers: [
      ControlTowerTraceService, provideHttpClient(), provideHttpClientTesting(),
    ] });
    const api = TestBed.inject(ControlTowerTraceService);
    const http = TestBed.inject(HttpTestingController);
    const id = '0123456789abcdef0123456789abcdef';

    let result: unknown;
    api.read(id.toUpperCase()).subscribe(value => { result = value; });
    const request = http.expectOne(
      environment.apiUrl.replace(/\/$/, '') + '/system/ControlTower/traces/' + id);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual([]);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({
      traceId: id, state: 'Captured', service: 'foundation-web',
      startedAtUtc: '2026-11-11T00:00:00Z', durationMs: 12.3,
      truncated: false, spans: [],
    });
    expect((result as { traceId: string }).traceId).toBe(id);
    http.verify();
  });

  it('rejects untrusted paths, URLs and malformed TraceIds before any request', () => {
    TestBed.configureTestingModule({ providers: [
      ControlTowerTraceService, provideHttpClient(), provideHttpClientTesting(),
    ] });
    const api = TestBed.inject(ControlTowerTraceService);
    const http = TestBed.inject(HttpTestingController);
    for (const bad of ['../admin', 'https://example.com', 'x'.repeat(32), '', 'a'.repeat(33)]) {
      expect(() => api.read(bad)).toThrow();
    }
    http.expectNone(() => true);
    http.verify();
  });
});
