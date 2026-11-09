import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  SystemAccountLifecycleService, SystemAccountLifecycleView,
} from './system-account-lifecycle.service';

/**
 * Reviewed System-only editor: the password and tenant/role/grant fields are
 * not rendered or accepted. The backend independently enforces every check.
 * This component is reachable only behind the default-OFF lifecycle guard
 * and the live System PAGE gate in the normal protected layout.
 */
@Component({
  selector: 'app-system-account-lifecycle',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink,
    MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule,
  ],
  template: `
    <main class="container py-4" dir="rtl">
      <mat-card class="p-4">
        <h2>مدیریت امن حساب سیستمی</h2>
        <p>فقط اطلاعات پروفایل و وضعیت حساب قابل تغییر هستند. تغییر رمز و دسترسی‌ها در فرایندهای جداگانه انجام می‌شود.</p>

        @if (error()) {
          <p role="alert" style="color:#b3261e">{{ error() }}</p>
        }
        @if (loading()) {
          <p>در حال خواندن اطلاعات حساب...</p>
        } @else if (account(); as user) {
          <p><strong>نام کاربری:</strong> {{ user.userName }} (غیرقابل تغییر)</p>
          <p><strong>وضعیت:</strong> {{ user.isActive ? 'فعال' : 'غیرفعال' }}
             / {{ user.isLockedOut ? 'قفل‌شده' : 'بدون قفل' }}</p>

          <form [formGroup]="profile" (ngSubmit)="saveProfile()">
            <mat-form-field appearance="outline">
              <mat-label>نام</mat-label>
              <input matInput formControlName="firstName" maxlength="80"
                [readonly]="busy()" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>نام خانوادگی</mat-label>
              <input matInput formControlName="lastName" maxlength="80"
                [readonly]="busy()" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>ایمیل</mat-label>
              <input matInput type="email" formControlName="email" maxlength="256"
                [readonly]="busy()" />
            </mat-form-field>
            <button mat-flat-button type="submit"
              [disabled]="busy() || profile.invalid || profile.pristine">
              ذخیره پروفایل
            </button>
          </form>

          <div class="d-flex flex-wrap gap-2 mt-3">
            <button mat-stroked-button type="button" (click)="setState(!user.isActive)"
              [disabled]="busy()">
              {{ user.isActive ? 'غیرفعال‌کردن حساب' : 'فعال‌سازی مجدد حساب' }}
            </button>
            @if (user.isActive) {
              <button mat-stroked-button type="button" (click)="setLock(!user.isLockedOut)"
                [disabled]="busy()">
                {{ user.isLockedOut ? 'بازکردن قفل' : 'قفل‌کردن حساب' }}
              </button>
            }
          </div>
          <p>فعال‌سازی مجدد فقط برای حسابی مجاز است که قبلاً فرایند ورود اولیه را کامل کرده باشد.</p>
        }
        <div class="d-flex gap-2 mt-3">
          <button mat-button type="button" (click)="reload()" [disabled]="busy()">
            بارگذاری مجدد
          </button>
          <a mat-button routerLink="/system/admins">بازگشت به مدیران</a>
        </div>
      </mat-card>
    </main>
  `,
})
export class SystemAccountLifecycleComponent implements OnInit {
  private readonly api = inject(SystemAccountLifecycleService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly id = this.route.snapshot.paramMap.get('userId') ?? '';

  readonly account = signal<SystemAccountLifecycleView | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');

  readonly profile = new FormGroup({
    firstName: new FormControl('', {
      nonNullable: true, validators: [Validators.required, Validators.maxLength(80)],
    }),
    lastName: new FormControl('', {
      nonNullable: true, validators: [Validators.required, Validators.maxLength(80)],
    }),
    email: new FormControl('', {
      nonNullable: true, validators: [Validators.required, Validators.email, Validators.maxLength(256)],
    }),
  });

  ngOnInit(): void { this.reload(); }

  reload(): void {
    if (this.busy() || !this.id) {
      if (!this.id) { this.error.set('شناسه حساب معتبر نیست.'); this.loading.set(false); }
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.api.get(this.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: view => {
        this.apply(view);
        this.loading.set(false);
      },
      error: err => {
        this.fail(err);
        this.loading.set(false);
      },
    });
  }

  private apply(view: SystemAccountLifecycleView): void {
    if (!view || !view.version || view.id !== this.id) {
      this.error.set('اطلاعات نسخه حساب قابل تأیید نیست.');
      return;
    }
    this.account.set(view);
    this.profile.setValue({
      firstName: view.firstName ?? '',
      lastName: view.lastName ?? '',
      email: view.email ?? '',
    });
    this.profile.markAsPristine();
  }

  saveProfile(): void {
    const view = this.account();
    if (!view || !view.version || this.busy() || this.profile.invalid ||
        this.profile.pristine) return;
    this.busy.set(true);
    this.error.set('');
    this.api.updateProfile(this.id, {
      ...this.profile.getRawValue(), expectedVersion: view.version,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: updated => { this.apply(updated); this.busy.set(false); },
      error: err => { this.fail(err); this.busy.set(false); },
    });
  }

  setState(desired: boolean): void {
    const view = this.account();
    if (!view || !view.version || this.busy()) return;
    if (!window.confirm(desired
      ? 'آیا از فعال‌سازی مجدد این حساب اطمینان دارید؟'
      : 'این تغییر نشست‌های فعلی کاربر را باطل می‌کند. ادامه می‌دهید؟')) return;
    this.busy.set(true);
    this.error.set('');
    this.api.setState(this.id, desired, view.version)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: updated => { this.apply(updated); this.busy.set(false); },
        error: err => { this.fail(err); this.busy.set(false); },
      });
  }

  setLock(desired: boolean): void {
    const view = this.account();
    if (!view?.isActive || !view.version || this.busy()) return;
    if (!window.confirm(desired
      ? 'قفل حساب باعث باطل‌شدن نشست‌های فعلی می‌شود. ادامه می‌دهید؟'
      : 'آیا قفل حساب را باز می‌کنید؟')) return;
    this.busy.set(true);
    this.error.set('');
    this.api.setLock(this.id, desired, view.version)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: updated => { this.apply(updated); this.busy.set(false); },
        error: err => { this.fail(err); this.busy.set(false); },
      });
  }

  private fail(error: { status?: number }): void {
    const status = error?.status;
    this.error.set(status === 409
      ? 'اطلاعات حساب توسط درخواست دیگری تغییر کرده است. لطفاً بارگذاری مجدد کنید.'
      : status === 403
        ? 'اجازه تغییر این حساب وجود ندارد یا عملیات در این محیط فعال نیست.'
        : status === 400
          ? 'داده‌های ارسال‌شده معتبر نیست.'
          : 'عملیات حساب انجام نشد. دوباره تلاش کنید.');
  }
}
