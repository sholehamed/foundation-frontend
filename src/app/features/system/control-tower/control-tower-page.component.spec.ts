import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ControlTowerPageComponent } from './control-tower-page.component';
import { ControlTowerTrace, ControlTowerTraceService } from './control-tower-trace.service';

const id = 'abcdef1234567890abcdef1234567890';
const sample: ControlTowerTrace = {
  traceId: id, state: 'Captured', service: 'foundation-web',
  startedAtUtc: '2026-11-11T10:00:00Z', durationMs: 16,
  truncated: false,
  spans: [
    {
      spanId: '1111111111111111', parentSpanId: null,
      name: 'foundation.http.pipeline', category: 'pipeline',
      startedAtUtc: '2026-11-11T10:00:00Z', durationMs: 16,
      error: false, attributes: { 'http.route': '/api/System/Dashboard' },
    },
    {
      spanId: '2222222222222222', parentSpanId: '1111111111111111',
      name: 'db.ef.command', category: 'sql',
      startedAtUtc: '2026-11-11T10:00:00.005Z', durationMs: 3,
      error: true, attributes: { 'foundation.db.client': 'ef-core' },
    },
  ],
};

describe('ControlTowerPageComponent — actual privileged Trace API only', () => {
  let fixture: ComponentFixture<ControlTowerPageComponent>;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let read: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    params = new BehaviorSubject(convertToParamMap({}));
    read = vi.fn(() => of(sample));
    await TestBed.configureTestingModule({
      imports: [ControlTowerPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: params.asObservable(),
            snapshot: { queryParamMap: convertToParamMap({}) },
          },
        },
        { provide: ControlTowerTraceService, useValue: { read } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ControlTowerPageComponent);
  });

  afterEach(() => fixture.destroy());

  it('starts empty and never fabricates system metrics or trace samples', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance.status()).toBe('idle');
    expect(fixture.nativeElement.textContent).toContain('TraceId را وارد کنید');
    expect(read).not.toHaveBeenCalled();
  });

  it('resolves a URL TraceId, renders true stored spans, SQL waterfall and safe details', () => {
    fixture.detectChanges();
    params.next(convertToParamMap({ traceId: id }));
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(read).toHaveBeenCalledWith(id);
    expect(component.status()).toBe('captured');
    expect(component.sqlCount()).toBe(1);
    expect(component.errorCount()).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('.timeline-row').length).toBe(2);
    component.setFilter('sql');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.timeline-row').length).toBe(1);
    component.choose(sample.spans[1]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('foundation.db.client');
    expect(fixture.nativeElement.textContent).not.toContain('SELECT customer_password');
    expect(component.offset(sample.spans[1])).toBeGreaterThan(0);
    expect(component.width(sample.spans[1])).toBeGreaterThan(0);
  });

  it.each([
    [400, 'invalid'], [401, 'forbidden'], [403, 'forbidden'],
    [404, 'not-retained'], [429, 'unavailable'], [503, 'unavailable'],
    [500, 'failed'],
  ] as const)('shows actual HTTP %i as %s and clears prior data', (code, state) => {
    read.mockReturnValueOnce(of(sample))
      .mockReturnValueOnce(throwError(() => ({ status: code })));
    fixture.detectChanges();
    params.next(convertToParamMap({ traceId: id }));
    expect(fixture.componentInstance.data()).not.toBeNull();
    params.next(convertToParamMap({ traceId: id }));
    fixture.detectChanges();
    expect(fixture.componentInstance.status()).toBe(state);
    expect(fixture.componentInstance.data()).toBeNull();
    expect(fixture.nativeElement.querySelector('.timeline-row')).toBeNull();
  });

  it('rejects invalid TraceId without touching backend and keeps errors explicit', () => {
    fixture.detectChanges();
    params.next(convertToParamMap({ traceId: 'bad-id' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.status()).toBe('invalid');
    expect(read).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('شناسه نامعتبر');
  });

  it('rejects incompatible API data instead of rendering guessed or unsafe spans', () => {
    read.mockReturnValue(of({ ...sample, traceId: '00000000000000000000000000000000' }));
    fixture.detectChanges();
    params.next(convertToParamMap({ traceId: id }));
    fixture.detectChanges();
    expect(fixture.componentInstance.status()).toBe('failed');
    expect(fixture.componentInstance.data()).toBeNull();
  });
});
