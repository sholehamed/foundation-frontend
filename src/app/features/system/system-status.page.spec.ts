import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { SystemStatusPage } from './system-status.page';

describe('SystemStatusPage', () => {
  it('reports successful backend connectivity', async () => {
    await TestBed.configureTestingModule({
      imports: [SystemStatusPage],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    const fixture = TestBed.createComponent(SystemStatusPage);
    const backend = TestBed.inject(HttpTestingController);
    const request = backend.expectOne('/api/v1/system/ping');
    request.flush({ status: 'ok' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Status: online');
    backend.verify();
  });
});
