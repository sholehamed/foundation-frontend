import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  TenantBranchWriteRequest, TenantWorkspaceBranch, TenantWorkspaceService,
} from './tenant-workspace.service';

@Component({
  selector: 'app-tenant-branches',
  standalone: true,
  imports: [MatButtonModule, ReactiveFormsModule],
  styleUrl: './tenant-workspace.styles.scss',
  template: `
    <section class="tenant-page">
      <div class="tenant-page-heading">
        <div>
          <p class="eyebrow">BRANCHES</p>
          <h1>شعبه‌های فضای کاری</h1>
          <p>فقط شعبه‌های متعلق به فضای کاری فعلی قابل مشاهده هستند.</p>
        </div>
        <div class="tenant-actions">
          <button mat-stroked-button type="button" (click)="load()" [disabled]="loading()">به‌روزرسانی</button>
          @if (canManageBranches()) {
            <button mat-flat-button type="button" (click)="openEditor()" [disabled]="saving()">ثبت شعبه جدید</button>
          }
        </div>
      </div>
      @if (notice()) {
        <div class="tenant-feedback" role="status">{{ notice() }}</div>
      }
      @if (editorOpen() && canManageBranches()) {
        <form class="tenant-panel tenant-branch-form" [formGroup]="form" (ngSubmit)="save()">
          <div class="tenant-page-heading">
            <h2>{{ editingId() ? 'ویرایش مشخصات شعبه' : 'ثبت شعبه جدید' }}</h2>
          </div>
          <p>شعبه جدید به صورت غیر اصلی ثبت می‌شود؛ امکان تغییر جایگاه شعبه اصلی در این مرحله وجود ندارد.</p>
          <div class="tenant-form-fields">
            <label>
              نام شعبه
              <input type="text" formControlName="name" maxlength="120" autocomplete="off"/>
              @if (form.controls.name.touched && form.controls.name.invalid) {
                <small class="tenant-field-error">نام شعبه الزامی است (حداکثر ۱۲۰ کاراکتر).</small>
              }
            </label>
            <label>
              شهر
              <input type="text" formControlName="city" maxlength="80" autocomplete="off"/>
              @if (form.controls.city.touched && form.controls.city.invalid) {
                <small class="tenant-field-error">شهر الزامی است (حداکثر ۸۰ کاراکتر).</small>
              }
            </label>
            <label class="wide">
              نشانی
              <textarea formControlName="address" rows="2" maxlength="400"></textarea>
              @if (form.controls.address.touched && form.controls.address.invalid) {
                <small class="tenant-field-error">نشانی الزامی است (حداکثر ۴۰۰ کاراکتر).</small>
              }
            </label>
            <label>
              شماره تماس (اختیاری)
              <input type="tel" formControlName="phone" maxlength="20"/>
              @if (form.controls.phone.touched && form.controls.phone.invalid) {
                <small class="tenant-field-error">حداکثر ۲۰ کاراکتر مجاز است.</small>
              }
            </label>
          </div>
          @if (saveError()) {
            <div class="tenant-feedback error" role="alert">{{ saveError() }}</div>
          }
          <div class="tenant-actions tenant-form-actions">
            <button mat-flat-button type="submit" [disabled]="saving() || form.invalid">
              {{ saving() ? 'در حال ذخیره...' : 'ذخیره' }}
            </button>
            <button mat-stroked-button type="button" (click)="closeEditor()" [disabled]="saving()">انصراف</button>
          </div>
        </form>
      }
      @if (loading()) {
        <div class="tenant-feedback" role="status">در حال دریافت شعبه‌ها...</div>
      } @else if (error()) {
        <div class="tenant-feedback error" role="alert">
          {{ error() }}
          <button mat-flat-button type="button" (click)="load()">تلاش مجدد</button>
        </div>
      } @else if (branches(); as list) {
        @if (list.length === 0) {
          <div class="tenant-feedback" role="status">شعبه‌ای برای این فضای کاری ثبت نشده است.</div>
        } @else {
          <div class="tenant-branch-grid">
            @for (branch of list; track branch.id) {
              <article class="tenant-card branch-card">
                <span class="material-symbols-outlined" aria-hidden="true">store</span>
                <div class="branch-title">
                  <h2>{{ branch.name }}</h2>
                  @if (branch.isMain) { <span class="tenant-tag">شعبه اصلی</span> }
                </div>
                <dl class="tenant-details">
                  <div><dt>شهر</dt><dd>{{ branch.city || '—' }}</dd></div>
                  <div><dt>آدرس</dt><dd>{{ branch.address || '—' }}</dd></div>
                  <div><dt>شماره تماس</dt><dd>{{ branch.phone || '—' }}</dd></div>
                </dl>
                @if (canManageBranches()) {
                  <button mat-stroked-button type="button" (click)="openEditor(branch)" [disabled]="saving()">
                    ویرایش مشخصات
                  </button>
                }
              </article>
            }
          </div>
        }
      }
    </section>
  `,
})
export class TenantBranchesComponent implements OnInit {
  private readonly api = inject(TenantWorkspaceService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  readonly branches = signal<TenantWorkspaceBranch[] | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly canManageBranches = signal(false);
  readonly editorOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    city: ['', [Validators.required, Validators.maxLength(80)]],
    address: ['', [Validators.required, Validators.maxLength(400)]],
    phone: ['', [Validators.maxLength(20)]],
  });

  ngOnInit(): void {
    this.refreshCapabilities();
    this.load();
  }

  refreshCapabilities(): void {
    this.api.getAdminCapabilities().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        const allowed = result?.canManageBranches === true;
        this.canManageBranches.set(allowed);
        if (!allowed) this.closeEditor();
      },
      error: () => {
        this.canManageBranches.set(false);
        this.closeEditor();
      },
    });
  }

  openEditor(branch?: TenantWorkspaceBranch): void {
    if (!this.canManageBranches() || this.saving()) return;
    this.saveError.set(null);
    this.notice.set(null);
    this.editingId.set(branch?.id ?? null);
    this.form.reset({
      name: branch?.name ?? '',
      city: branch?.city ?? '',
      address: branch?.address ?? '',
      phone: branch?.phone ?? '',
    });
    this.editorOpen.set(true);
  }

  closeEditor(): void {
    if (this.saving()) return;
    this.editorOpen.set(false);
    this.editingId.set(null);
    this.saveError.set(null);
  }

  save(): void {
    if (!this.canManageBranches() || this.saving()) return;
    this.form.markAllAsTouched();
    const fields = this.form.getRawValue();
    const request: TenantBranchWriteRequest = {
      name: fields.name.trim(), city: fields.city.trim(),
      address: fields.address.trim(), phone: fields.phone.trim() || null,
    };
    if (this.form.invalid || !request.name || !request.city || !request.address) {
      this.saveError.set('نام شعبه، شهر و نشانی را کامل وارد کنید.');
      return;
    }
    this.saving.set(true);
    this.saveError.set(null);
    const id = this.editingId();
    const operation = id ? this.api.updateBranch(id, request) : this.api.createBranch(request);
    operation.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeEditor();
        this.notice.set(id ? 'مشخصات شعبه به‌روزرسانی شد.' : 'شعبه جدید ثبت شد.');
        this.load();
      },
      error: (err: { status?: number }) => {
        this.saving.set(false);
        if (err?.status === 403) {
          this.canManageBranches.set(false);
          this.closeEditor();
          this.saveError.set(null);
          this.error.set('مجوز مدیریت شعبه معتبر نیست؛ دسترسی را دوباره بررسی کنید.');
          this.branches.set(null);
        } else {
          this.saveError.set(err?.status === 400
            ? 'مقادیر فرم با قوانین ثبت شعبه مطابقت ندارند.'
            : 'ذخیره شعبه انجام نشد. دوباره تلاش کنید.');
        }
      },
    });
  }

  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.branches.set(null);
    this.api.getBranches().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        if (Array.isArray(data)) this.branches.set(data);
        else this.error.set('پاسخ فهرست شعبه‌ها نامعتبر است.');
        this.loading.set(false);
      },
      error: () => {
        this.error.set('دریافت شعبه‌ها ناموفق بود. اتصال را بررسی کنید.');
        this.loading.set(false);
      },
    });
  }
}
