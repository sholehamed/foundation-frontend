import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';

type BackendState = 'checking' | 'online' | 'offline';

@Component({
  selector: 'app-system-status-page',
  standalone: true,
  template: `
    <section class="status-panel">
      <span class="eyebrow">API CONNECTIVITY</span>
      <h1>Backend connection</h1>
      <p>Checks the public bootstrap endpoint over the local /api development proxy.</p>
      <p class="status-value" aria-live="polite">Status: {{ status() }}</p>
      @if (status() === 'offline') {
        <p class="subtle">Backend is unavailable. Start the .NET API on http://localhost:5080.</p>
      }
    </section>
  `
})
export class SystemStatusPage {
  private readonly http = inject(HttpClient);
  readonly status = signal<BackendState>('checking');

  constructor() {
    this.http.get<{ status: string }>('/api/v1/system/ping').subscribe({
      next: response => this.status.set(response.status === 'ok' ? 'online' : 'offline'),
      error: () => this.status.set('offline')
    });
  }
}
