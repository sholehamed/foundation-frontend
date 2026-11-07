import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FeatureRegistryApiService, FeatureRegistryPreview } from './feature-registry-api.service';

@Component({
  selector: 'app-feature-registry',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './feature-registry.component.html',
  styleUrl: './feature-registry.component.scss',
})
export class FeatureRegistryPageComponent implements OnInit {
  private readonly api = inject(FeatureRegistryApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly preview = signal<FeatureRegistryPreview | null>(null);
  readonly loading = signal(false);
  readonly applying = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  ngOnInit(): void {
    this.loadPreview();
  }

  loadPreview(): void {
    if (this.loading() || this.applying()) return;
    this.loading.set(true);
    this.preview.set(null);
    this.error.set(null);

    this.api.preview()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.preview.set(result);
          this.loading.set(false);
        },
        error: error => {
          this.error.set(error?.status === 403
            ? 'دسترسی به رجیستری برای حساب شما مجاز نیست.'
            : 'دریافت وضعیت رجیستری ناموفق بود. مجدداً تلاش کنید.');
          this.loading.set(false);
        },
      });
  }

  applyChanges(): void {
    const current = this.preview();
    if (this.applying() || this.loading() || !current?.canApply || !current.hasPending)
      return;

    // Explicit human approval. Do not automatically apply on navigation,
    // login, failed preview, or after a retry.
    if (!window.confirm('موارد جدید در دیتابیس ثبت شوند؟ هیچ دسترسی‌ای به نقش یا کاربر داده نمی‌شود.'))
      return;

    this.applying.set(true);
    this.error.set(null);
    this.message.set(null);
    this.api.apply()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.applying.set(false);
          this.message.set('ثبت تعاریف انجام شد. وضعیت جدید را بررسی کنید.');
          this.loadPreview();
        },
        error: error => {
          this.applying.set(false);
          this.preview.set(null);
          this.error.set(error?.status === 409
            ? 'ثبت متوقف شد: Sync غیرفعال است یا داده‌ها تداخل دارند. تنظیمات و Preview را بررسی کنید.'
            : error?.status === 403
              ? 'شما مجوز اعمال تغییرات را ندارید.'
              : 'ثبت تعاریف ناموفق بود؛ پیش از تکرار وضعیت دیتابیس را بررسی کنید.');
        },
      });
  }

  count(state: string): number {
    return this.preview()?.changes.filter(x => x.state === state).length ?? 0;
  }
}
