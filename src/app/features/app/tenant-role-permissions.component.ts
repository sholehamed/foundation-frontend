import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import {
  TenantRolePermissionMatrix, TenantWorkspaceService,
} from './tenant-workspace.service';

@Component({
  selector: 'app-tenant-role-permissions',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  styleUrl: './tenant-workspace.styles.scss',
  template: `
    <section class="tenant-page">
      <div class="tenant-page-heading">
        <div>
          <p class="eyebrow">ROLE PERMISSIONS</p>
          <h1>مجوزهای نقش {{ matrix()?.roleName || '' }}</h1>
          <p>وضعیت ثبت در کاتالوگ و تخصیص مستقیم به نقش در مستأجر جاری.</p>
          <p>این فهرست مجوز مؤثر کاربر نیست و در این مرحله فقط قابل مشاهده است.</p>
        </div>
        <div class="tenant-actions">
          <a routerLink="/dashboard/roles" mat-stroked-button>بازگشت به نقش‌ها</a>
          <button mat-stroked-button type="button" (click)="load()" [disabled]="loading()">
            به‌روزرسانی
          </button>
        </div>
      </div>
      @if (loading()) {
        <div class="tenant-feedback" role="status">در حال دریافت مجوزهای نقش...</div>
      } @else if (error()) {
        <div class="tenant-feedback error" role="alert">
          {{ error() }}
          <button mat-flat-button type="button" (click)="load()">تلاش مجدد</button>
        </div>
      } @else if (matrix(); as info) {
        <div class="tenant-panel tenant-role-permission-list">
          @for (permission of info.permissions; track permission.code) {
            <article class="tenant-role-permission-item">
              <div>
                <h2>{{ permission.name }}</h2>
                <small>{{ permission.code }} · {{ permission.kind }}</small>
              </div>
              <span class="tenant-role-permission-state"
                [class.denied]="permission.registered && !permission.granted"
                [class.missing]="!permission.registered">
                {{ !permission.registered ? 'ثبت‌نشده در کاتالوگ' :
                   permission.granted ? 'تخصیص مستقیم دارد' : 'تخصیص ندارد' }}
              </span>
            </article>
          } @empty {
            <p class="notice">مجوزی برای این نقش تعریف نشده است.</p>
          }
        </div>
      }
    </section>
  `,
})
export class TenantRolePermissionsComponent implements OnInit {
  private readonly api = inject(TenantWorkspaceService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly matrix = signal<TenantRolePermissionMatrix | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void { this.load(); }

  load(): void {
    if (this.loading()) return;
    this.error.set(null);
    this.matrix.set(null);
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      this.error.set('شناسه نقش معتبر نیست.');
      return;
    }
    this.loading.set(true);
    this.api.getRolePermissions(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        if (!result || result.roleId.toLowerCase() !== id.toLowerCase() ||
          !Array.isArray(result.permissions)) {
          this.error.set('پاسخ مجوزهای نقش معتبر نیست.');
        } else {
          this.matrix.set(result);
        }
        this.loading.set(false);
      },
      error: (err: { status?: number }) => {
        this.error.set(err?.status === 403
          ? 'برای مشاهده مجوزهای این نقش دسترسی لازم را ندارید.'
          : err?.status === 404
            ? 'این نقش در فضای کاری فعلی پیدا نشد.'
            : 'دریافت مجوزهای نقش ناموفق بود.');
        this.loading.set(false);
      },
    });
  }
}
