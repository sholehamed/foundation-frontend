import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type ControlTowerSpanCategory = 'sql' | 'handler' | 'pipeline' | 'http';

export interface ControlTowerSpan {
  spanId: string;
  parentSpanId: string | null;
  name: string;
  category: ControlTowerSpanCategory;
  startedAtUtc: string;
  durationMs: number;
  error: boolean;
  attributes: Record<string, string>;
}

export interface ControlTowerTrace {
  traceId: string;
  state: 'Captured' | 'PartiallyCaptured';
  service: string;
  startedAtUtc: string;
  durationMs: number;
  spans: ControlTowerSpan[];
  truncated: boolean;
}

/**
 * Browser never receives Tempo credentials/endpoints or raw OTLP. The API
 * authenticates SystemAdministrators and enforces the live, revocable
 * CONTROL-TOWER.TRACES.READ permission on every request.
 */
@Injectable({ providedIn: 'root' })
export class ControlTowerTraceService {
  private readonly http = inject(HttpClient);
  private readonly root =
    environment.apiUrl.replace(/\/$/, '') + '/system/ControlTower/traces/';

  read(traceId: string): Observable<ControlTowerTrace> {
    if (!/^[0-9a-f]{32}$/i.test(traceId)) {
      throw new Error('شناسه Trace معتبر نیست.');
    }
    return this.http.get<ControlTowerTrace>(
      this.root + encodeURIComponent(traceId.toLowerCase())
    );
  }
}
