import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit,
  computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ControlTowerSpan, ControlTowerTrace, ControlTowerTraceService } from './control-tower-trace.service';

type ExplorerState =
  'idle' | 'loading' | 'captured' | 'not-retained' |
  'unavailable' | 'forbidden' | 'invalid' | 'failed';
type SpanFilter = 'all' | 'sql' | 'handler' | 'errors';

/**
 * A source-backed, read-only System Admin Trace Inspector.
 * No mock payloads, arbitrary SQL/trace storage URL or sensitive body export.
 */
@Component({
  selector: 'app-control-tower-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './control-tower-page.component.html',
  styleUrl: './control-tower-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlTowerPageComponent implements OnInit {
  private readonly api = inject(ControlTowerTraceService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly query = signal('');
  readonly status = signal<ExplorerState>('idle');
  readonly data = signal<ControlTowerTrace | null>(null);
  readonly message = signal('');
  readonly filter = signal<SpanFilter>('all');
  readonly selectedId = signal<string | null>(null);
  readonly copied = signal(false);

  readonly visible = computed(() => {
    const trace = this.data();
    if (!trace) return [];
    const mode = this.filter();
    return trace.spans.filter(span =>
      mode === 'all' || (mode === 'errors' ? span.error : span.category === mode));
  });
  readonly selected = computed(() =>
    this.data()?.spans.find(span => span.spanId === this.selectedId()) ?? null);
  readonly sqlCount = computed(() =>
    this.data()?.spans.filter(span => span.category === 'sql').length ?? 0);
  readonly errorCount = computed(() =>
    this.data()?.spans.filter(span => span.error).length ?? 0);

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const traceId = params.get('traceId') ?? '';
      this.query.set(traceId);
      if (traceId) this.load(traceId);
    });
  }

  onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  search(): void {
    const id = this.query().trim().toLowerCase();
    if (!/^[0-9a-f]{32}$/.test(id)) {
      this.data.set(null);
      this.status.set('invalid');
      this.message.set('TraceId باید دقیقاً ۳۲ کاراکتر هگزادسیمال باشد.');
      return;
    }
    if (this.route.snapshot.queryParamMap.get('traceId') === id) {
      this.load(id);
      return;
    }
    void this.router.navigate([], {
      relativeTo: this.route, queryParams: { traceId: id },
      queryParamsHandling: 'merge', replaceUrl: true,
    });
  }

  refresh(): void {
    const id = this.route.snapshot.queryParamMap.get('traceId');
    if (id) this.load(id);
  }

  private load(id: string): void {
    if (!/^[0-9a-f]{32}$/i.test(id)) {
      this.data.set(null);
      this.status.set('invalid');
      this.message.set('TraceId نامعتبر است.');
      return;
    }
    this.data.set(null);
    this.status.set('loading');
    this.message.set('');
    this.selectedId.set(null);
    this.filter.set('all');
    this.copied.set(false);
    this.api.read(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        if (!result || !Array.isArray(result.spans) || result.traceId !== id.toLowerCase() ||
            !Number.isFinite(result.durationMs) || result.durationMs < 0) {
          this.status.set('failed');
          this.message.set('پاسخ سرویس پایش معتبر نیست.');
          return;
        }
        this.data.set(result);
        this.status.set('captured');
      },
      error: (error: { status?: number }) => {
        this.data.set(null);
        this.status.set(
          error.status === 400 ? 'invalid' :
          error.status === 401 || error.status === 403 ? 'forbidden' :
          error.status === 404 ? 'not-retained' :
          error.status === 429 || error.status === 503 ? 'unavailable' : 'failed');
        this.message.set(error.status === 400
          ? 'شناسه درخواست معتبر نیست.'
          : error.status === 401 || error.status === 403
            ? 'دسترسی شما به جزئیات پایش مجاز نیست.'
            : error.status === 404
              ? 'برای این شناسه Trace ذخیره‌شده‌ای پیدا نشد؛ ممکن است نمونه‌برداری نشده یا منقضی شده باشد.'
              : error.status === 429
                ? 'محدودیت تعداد جستجو فعال شده است. بعداً دوباره بررسی کنید.'
                : error.status === 503
                  ? 'سامانه ذخیره Trace در دسترس نیست یا هنوز فعال نشده است.'
                  : 'خواندن اطلاعات پایش ناموفق بود.');
      },
    });
  }

  setFilter(next: SpanFilter): void {
    this.filter.set(next);
  }

  choose(span: ControlTowerSpan): void {
    this.selectedId.set(span.spanId === this.selectedId() ? null : span.spanId);
  }

  offset(span: ControlTowerSpan): number {
    const trace = this.data();
    if (!trace || trace.durationMs <= 0) return 0;
    const delta = new Date(span.startedAtUtc).getTime() -
      new Date(trace.startedAtUtc).getTime();
    return Math.max(0, Math.min(99, (delta / trace.durationMs) * 100));
  }

  width(span: ControlTowerSpan): number {
    const trace = this.data();
    if (!trace || trace.durationMs <= 0) return 100;
    return Math.max(0.8, Math.min(100 - this.offset(span),
      (span.durationMs / trace.durationMs) * 100));
  }

  date(value: string): string {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' :
      new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
        timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'medium',
      }).format(parsed) + ' UTC';
  }

  async copy(): Promise<void> {
    const id = this.data()?.traceId;
    if (!id || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(id);
      this.copied.set(true);
    } catch {
      this.copied.set(false);
    }
  }
}
