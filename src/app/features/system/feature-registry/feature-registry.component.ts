import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, from, of } from 'rxjs';
import { SystemCanDirective } from '../../../shared/permissions/system-can.directive';
import { SystemUiAccessService } from '../../../shared/permissions/system-ui-access.service';
import { SYSTEM_UI_ACCESS_PILOT_ENABLED } from '../../../shared/permissions/system-ui-access-pilot.token';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FeatureRegistryApiService, FeatureRegistryPreview } from './feature-registry-api.service';
import { validateBackendFeatureManifest } from './feature-registry-contract';
import { discoverExecutableSystemChildRoutes } from './system-ui-route-discovery';

@Component({
  selector: 'app-feature-registry',
  standalone: true,
  imports: [CommonModule, SystemCanDirective, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './feature-registry.component.html',
  styleUrl: './feature-registry.component.scss',
})
export class FeatureRegistryPageComponent implements OnInit {
  private readonly api = inject(FeatureRegistryApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly enabled = inject(SYSTEM_UI_ACCESS_PILOT_ENABLED);
  // Avoid injecting the HTTP permission client for old/offline test fixtures
  // and existing deployments while the explicit rollout flag remains off.
  private readonly access = this.enabled ? inject(SystemUiAccessService) : null;

  readonly preview = signal<FeatureRegistryPreview | null>(null);
  readonly manifestVerified = signal(false);
  readonly manifestProblems = signal<string[]>([]);
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
    this.manifestVerified.set(false);
    this.manifestProblems.set([]);
    this.error.set(null);

    // Compare authoritative backend definitions with the executable Angular
    // route index. Neither response grants authorization to a user.
    forkJoin({
      preview: this.api.preview(),
      manifest: this.api.manifest(),
      childRoutes: from(discoverExecutableSystemChildRoutes()),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ preview, manifest, childRoutes }) => {
          this.manifestProblems.set(
            validateBackendFeatureManifest(manifest, undefined, childRoutes));
          this.manifestVerified.set(true);
          this.preview.set(preview);
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
    if (this.applying() || this.loading() || !this.manifestVerified() ||
        this.manifestProblems().length > 0 || !current?.canApply || !current.hasPending)
      return;

    // Explicit human approval. Do not automatically apply on navigation,
    // login, failed preview, or after a retry.
    if (!window.confirm('موارد جدید در دیتابیس ثبت شوند؟ هیچ دسترسی‌ای به نقش یا کاربر داده نمی‌شود.'))
      return;

    this.applying.set(true);
    this.error.set(null);
    this.message.set(null);
    (this.enabled
      ? this.access!.refreshAction('system.feature-registry.action.apply')
      : of(true))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(allowed => {
        if (!allowed) {
          this.applying.set(false);
          this.error.set('مجوز اعمال رجیستری معتبر نیست یا لغو شده است.');
          return;
        }
        this.runApprovedApply();
      });
  }

  private runApprovedApply(): void {
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
