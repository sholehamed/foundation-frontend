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
import { CentralAccessReadiness, FeatureRegistryApiService, FeatureRegistryPreview, SystemEndpointIntegrity, TenantNavigationReadiness, TenantPermissionCatalogPreview } from './feature-registry-api.service';
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
  readonly tenantApplying = signal(false);
  readonly diagnosticsLoading = signal(false);
  readonly diagnosticsError = signal<string | null>(null);
  readonly tenantCatalog = signal<TenantPermissionCatalogPreview | null>(null);
  readonly navigation = signal<TenantNavigationReadiness | null>(null);
  readonly endpointIntegrity = signal<SystemEndpointIntegrity | null>(null);
  readonly centralAccess = signal<CentralAccessReadiness | null>(null);

  // This is a catalog-only readiness signal, NOT permission/grant, staging
  // deployment, two-Tenant browser, keyring or production certification.
  centralCatalogReady(): boolean {
    const preview = this.preview();
    const tenant = this.tenantCatalog();
    const aggregate = this.centralAccess();
    // An older independent preview must not be presented as a successful
    // operator gate after backend rows/links change. The server aggregate
    // remains read-only and is not a pilot activation approval.
    return this.manifestVerified() && this.manifestProblems().length === 0 &&
      preview?.canApply === true && preview.hasPending === false &&
      tenant?.canApply === true && tenant.hasPending === false &&
      this.navigation()?.readyForDynamicPilot === true &&
      this.endpointIntegrity()?.readyForGranularEnforcement === true &&
      aggregate?.centralCatalogConsistent === true &&
      aggregate.blockingChecks.length === 0 &&
      aggregate.systemRegistry.ready === true &&
      aggregate.tenantPermissionCatalog.ready === true &&
      aggregate.tenantNavigation.ready === true &&
      aggregate.systemEndpoints.ready === true &&
      aggregate.systemRegistry.fingerprint === preview.fingerprint &&
      aggregate.tenantPermissionCatalog.fingerprint === tenant.fingerprint;
  }

  tenantPendingCount(): number {
    return this.tenantCatalog()?.changes.filter(x => x.state !== 'Present').length ?? 0;
  }

  endpointProblems(): SystemEndpointIntegrity['endpoints'] {
    return this.endpointIntegrity()?.endpoints.filter(x => x.status !== 'ready') ?? [];
  }

  ngOnInit(): void {
    this.loadPreview();
    this.loadDiagnostics();
  }

  // A separate read-only SuperAdmin diagnostic: failure cannot hide the
  // original preview or accidentally enable a catalog apply operation.
  loadDiagnostics(): void {
    if (this.diagnosticsLoading() || this.applying() || this.tenantApplying()) return;
    this.diagnosticsLoading.set(true);
    this.diagnosticsError.set(null);
    this.tenantCatalog.set(null);
    this.navigation.set(null);
    this.endpointIntegrity.set(null);
    this.centralAccess.set(null);

    forkJoin({
      tenant: this.api.tenantPermissionPreview(),
      navigation: this.api.tenantNavigationReadiness(),
      endpoints: this.api.systemEndpointIntegrity(),
      aggregate: this.api.centralAccessReadiness(),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ tenant, navigation, endpoints, aggregate }) => {
        this.tenantCatalog.set(tenant);
        this.navigation.set(navigation);
        this.endpointIntegrity.set(endpoints);
        this.centralAccess.set(aggregate);
        this.diagnosticsLoading.set(false);
      },
      error: error => {
        // Never turn an unreadable/forbidden diagnostic into a green badge.
        this.diagnosticsError.set(error?.status === 403
          ? 'ممیزی‌های مرکزی فقط برای SuperAdmin فعال سیستم قابل مشاهده‌اند.'
          : 'دریافت ممیزی‌های مرکزی ناموفق بود؛ وضعیت آماده محسوب نمی‌شود.');
        this.diagnosticsLoading.set(false);
      },
    });
  }

  refresh(): void {
    this.loadPreview();
    this.loadDiagnostics();
  }

  loadPreview(): void {
    if (this.loading() || this.applying() || this.tenantApplying()) return;
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
    if (this.applying() || this.tenantApplying() || this.loading() || !this.manifestVerified() ||
        this.manifestProblems().length > 0 || !current?.canApply || !current.hasPending ||
        !/^[A-Fa-f0-9]{64}$/.test(current.fingerprint))
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
        this.runApprovedApply(current.fingerprint);
      });
  }

  applyTenantCatalog(): void {
    const snapshot = this.tenantCatalog();
    // The SQL transaction has its own fingerprint check. A stale/invalid
    // response must not be promoted to an operator Apply attempt.
    if (this.tenantApplying() || this.applying() || this.loading() ||
        this.diagnosticsLoading() || this.diagnosticsError() ||
        !snapshot?.canApply || !snapshot.hasPending ||
        !/^[A-Fa-f0-9]{64}$/.test(snapshot.fingerprint)) return;

    if (!window.confirm(
      'ثبت تعاریف مرکزی Tenant در دیتابیس؟ این عملیات هیچ دسترسی به کاربر یا نقش نمی‌دهد.'))
      return;

    this.tenantApplying.set(true);
    this.diagnosticsError.set(null);
    this.message.set(null);
    // Preserve the same optional UI ACTION check as the existing System
    // Registry Apply; backend independently enforces live System SuperAdmin.
    (this.enabled
      ? this.access!.refreshAction('system.feature-registry.action.apply')
      : of(true))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(allowed => {
        if (!allowed) {
          this.tenantApplying.set(false);
          this.tenantCatalog.set(null);
          this.diagnosticsError.set('مجوز اعمال کاتالوگ مرکزی معتبر نیست یا لغو شده است.');
          return;
        }
        this.api.tenantPermissionApply(snapshot.fingerprint)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.tenantApplying.set(false);
              this.message.set('درخواست ثبت کاتالوگ Tenant انجام شد؛ برای اطمینان وضعیت جدید بررسی می‌شود.');
              this.loadDiagnostics();
            },
            error: error => {
              this.tenantApplying.set(false);
              this.tenantCatalog.set(null); // never reuse a stale fingerprint
              this.diagnosticsError.set(error?.status === 409
                ? 'وضعیت کاتالوگ تغییر کرده یا Apply غیرفعال است (409). Preview را دوباره بررسی کنید.'
                : error?.status === 403
                  ? 'حساب شما مجوز ثبت تعاریف مرکزی را ندارد.'
                  : 'ثبت کاتالوگ انجام نشد؛ پیش از تلاش مجدد وضعیت دیتابیس را بررسی کنید.');
            },
          });
      });
  }

  private runApprovedApply(fingerprint: string): void {
    this.api.apply(fingerprint)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.applying.set(false);
          this.message.set('ثبت تعاریف انجام شد. وضعیت جدید را بررسی کنید.');
          this.loadPreview();
          this.loadDiagnostics();
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
