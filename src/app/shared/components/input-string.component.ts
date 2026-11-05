import { Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  ControlContainer,
  FormGroupDirective,
  ReactiveFormsModule,
  ValidationErrors
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, defaultIfEmpty, Observable, of, Subject, switchMap, take, tap } from 'rxjs';

export interface ValidationError {
  type: string;
  message: string;
}

/** امضای متد بررسی سمت سرور */
export type RemoteValidatorFn = (value: any) => Observable<ValidationErrors | null>;

/** نشانگر «هنوز چیزی بررسی نشده» — هرگز با هیچ مقداری برابر نمی‌شود */
const UNSET = Symbol('unset');

@Component({
  selector: 'app-custom-input',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective }
  ],
  template: `<div class="form-group">
    @if (label) {
      <label class="main-label d-block fw-medium" [for]="controlName">
        {{ label }}
      </label>
    }

    <mat-form-field>
      @if (placeholder) {
        <mat-label>{{ placeholder }}</mat-label>
      }

      <input matInput
             [type]="inputType"
             [id]="controlName"
             [formControlName]="controlName"
             [attr.aria-invalid]="!!errorMessage"
             [attr.aria-describedby]="describedBy"
             [attr.aria-busy]="pending"
             (blur)="onBlur()">

      @if (pending) {
        <mat-progress-spinner matSuffix
                              diameter="18"
                              mode="indeterminate"
                              [attr.aria-label]="pendingText" />
      } @else if (icon) {
        <mat-icon matSuffix>{{ icon }}</mat-icon>
      }

      @if (isPassword) {
        <button mat-icon-button
                matSuffix
                type="button"
                (click)="hide = !hide"
                [attr.aria-label]="hide ? 'نمایش رمز عبور' : 'پنهان کردن رمز عبور'"
                [attr.aria-pressed]="!hide">
          <span class="material-symbols-outlined">
            {{ hide ? 'visibility_off' : 'visibility' }}
          </span>
        </button>
      }
    </mat-form-field>

    @if (pending) {
      <div class="text-muted small" [id]="controlName + '-pending'" aria-live="polite">
        {{ pendingText }}
      </div>
    } @else if (errorMessage) {
      <div class="error text-danger" [id]="controlName + '-error'" role="alert">
        {{ errorMessage }}
      </div>
    }
  </div>`,
  styles:`:host {
    display: block;
    width: 100%;
}

.form-group {
    width: 100%;
    margin-bottom: 16px;

    // ==============================
    // Label
    // ==============================

    .main-label {
        margin-bottom: 8px;

        color: var(--headingColor);

        font-family: var(--fontFamily);
        font-size: 13px;
        font-weight: 500;

        line-height: 1.6;
    }


    // ==============================
    // Material Form Field
    // ==============================

    mat-form-field {
        width: 100%;

        // --------------------------
        // Outline appearance
        // --------------------------

        --mdc-outlined-text-field-input-text-color:
            var(--headingColor);

        --mdc-outlined-text-field-label-text-color:
            var(--mutedColor);

        --mdc-outlined-text-field-hover-label-text-color:
            var(--bodyColor);

        --mdc-outlined-text-field-focus-label-text-color:
            var(--primaryColor);

        --mdc-outlined-text-field-outline-color:
            var(--borderColor);

        --mdc-outlined-text-field-hover-outline-color:
            var(--bodyColor);

        --mdc-outlined-text-field-focus-outline-color:
            var(--primaryColor);

        --mdc-outlined-text-field-caret-color:
            var(--primaryColor);


        // --------------------------
        // Filled appearance
        // اگر Material به صورت fill باشد
        // --------------------------

        --mdc-filled-text-field-input-text-color:
            var(--headingColor);

        --mdc-filled-text-field-label-text-color:
            var(--mutedColor);

        --mdc-filled-text-field-hover-label-text-color:
            var(--bodyColor);

        --mdc-filled-text-field-focus-label-text-color:
            var(--primaryColor);

        --mdc-filled-text-field-caret-color:
            var(--primaryColor);

        --mdc-filled-text-field-container-color:
            var(--surfaceColor);


        // --------------------------
        // Error
        // --------------------------

        --mdc-outlined-text-field-error-label-text-color:
            var(--errorColor);

        --mdc-outlined-text-field-error-outline-color:
            var(--errorColor);

        --mdc-outlined-text-field-error-focus-outline-color:
            var(--errorColor);

        --mdc-filled-text-field-error-label-text-color:
            var(--errorColor);

        --mdc-filled-text-field-error-active-indicator-color:
            var(--errorColor);
    }


    // ==============================
    // Actual Input
    // ==============================

    input[matInput] {
        color: var(--headingColor);

        font-family: var(--fontFamily);
        font-size: 14px;
        font-weight: 400;

        caret-color: var(--primaryColor);

        &::placeholder {
            color: var(--mutedColor);
            opacity: 1;
        }

        // Chrome autofill
        &:-webkit-autofill,
        &:-webkit-autofill:hover,
        &:-webkit-autofill:focus {
            -webkit-text-fill-color: var(--headingColor);
            caret-color: var(--headingColor);

            transition:
                background-color 99999s ease-in-out 0s;
        }
    }


    // ==============================
    // Pending
    // ==============================

    .text-muted {
        margin-top: -10px;

        color: var(--mutedColor) !important;

        font-size: 11px;
        line-height: 1.6;
    }


    // ==============================
    // Error
    // ==============================

    .error {
        margin-top: -10px;

        color: var(--errorColor) !important;

        font-size: 11px;
        line-height: 1.6;
    }
}


// ======================================================
// Angular Material internal styles
// ======================================================

::ng-deep {

    .form-group {

        // ==========================
        // Input container
        // ==========================

        .mat-mdc-text-field-wrapper {
            min-height: 52px;

            border-radius: 10px;

            color: var(--headingColor);

            transition:
                border-color var(--transition),
                background-color var(--transition);
        }


        // ==========================
        // Flex area
        // ==========================

        .mat-mdc-form-field-flex {
            min-height: 52px;

            align-items: center;
        }


        // ==========================
        // Input
        // ==========================

        .mat-mdc-input-element {
            color: var(--headingColor) !important;

            font-family: var(--fontFamily) !important;
            font-size: 14px;

            &::placeholder {
                color: var(--mutedColor) !important;
                opacity: 1;
            }
        }


        // ==========================
        // Floating Label
        // ==========================

        .mat-mdc-floating-label {
            color: var(--mutedColor);

            font-family: var(--fontFamily) !important;
        }


        // ==========================
        // Suffix area
        // ==========================

        .mat-mdc-form-field-icon-suffix {
            display: flex;
            align-items: center;

            color: var(--mutedColor);
        }


        // ==========================
        // Normal suffix icon
        // ==========================

        mat-icon.mat-mdc-form-field-icon-suffix,
        .mat-mdc-form-field-icon-suffix mat-icon {
            color: var(--mutedColor);
        }


        // ==========================
        // Password eye button
        // ==========================

        button[mat-icon-button] {
            color: var(--mutedColor);

            transition:
                color var(--transition),
                background-color var(--transition);

            .material-symbols-outlined {
                color: inherit;

                font-size: 20px;
            }

            &:hover {
                color: var(--primaryColor);
            }
        }


        // ==========================
        // Spinner
        // ==========================

        mat-progress-spinner {
            --mdc-circular-progress-active-indicator-color:
                var(--primaryColor);
        }


        // ==========================
        // Form field subscript
        // ==========================

        .mat-mdc-form-field-subscript-wrapper {
            height: 0;
        }
    }
}


// ======================================================
// Mobile
// ======================================================

@media only screen and (max-width: 767px) {

    .form-group {
        margin-bottom: 14px;

        .main-label {
            margin-bottom: 7px;

            font-size: 12px;
        }

        input[matInput] {
            font-size: 13px;
        }
    }

    ::ng-deep {
        .form-group {

            .mat-mdc-text-field-wrapper,
            .mat-mdc-form-field-flex {
                min-height: 50px;
            }
        }
    }
}`
})
export class CustomInputComponent implements OnInit {
  @Input({ required: true }) controlName!: string;
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type: 'text' | 'password' | 'email' | 'number' = 'text';
  @Input() validationErrors: ValidationError[] = [];
  @Input() icon?: string;

  /** متدی که مقدار را می‌گیرد و ValidationErrors یا null برمی‌گرداند */
  @Input() remoteValidator?: RemoteValidatorFn;
  @Input() pendingText = 'در حال بررسی...';

  /** نرمال‌سازی ی/ک عربی قبل از ارسال و مقایسه (برای رمز عبور فعال نکنید) */
  @Input() normalizePersian = false;

  hide = true;
  pending = false;

  private readonly blur$ = new Subject<string>();
  private readonly destroyRef = inject(DestroyRef);
  private readonly controlContainer = inject(ControlContainer);

  /** کلیدهای خطایی که آخرین‌بار از سرور آمده‌اند */
  private remoteErrorKeys: string[] = [];
  private lastCheckedValue: string | symbol = UNSET;

  ngOnInit(): void {
    if (!this.remoteValidator) return;

    // هر تغییر مقدار، نتیجه بررسی قبلی را بی‌اعتبار می‌کند
    this.control?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.lastCheckedValue = UNSET;
        if (this.remoteErrorKeys.length) this.applyRemoteErrors(null);
      });

    this.blur$
      .pipe(
        tap(() => {
          // اول خطاهای قبلی سرور پاک، بعد pending — ترتیب مهم است
          this.applyRemoteErrors(null);
          this.pending = true;
          this.control?.markAsPending({ emitEvent: false });
        }),
        switchMap(value =>
          this.remoteValidator!(value).pipe(
            take(1),
            defaultIfEmpty<ValidationErrors | null, null>(null),
            catchError(() => {
              // خطای شبکه → کنترل را قفل نکن، ولی اجازه تلاش مجدد بده
              this.lastCheckedValue = UNSET;
              return of(null);
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(errors => {
        this.pending = false;
        // همیشه صدا زده می‌شود؛ حتی با null → خروج قطعی از PENDING
        this.applyRemoteErrors(errors);
      });
  }

  get control(): AbstractControl | null {
    return this.controlContainer.control?.get(this.controlName) ?? null;
  }

  get isPassword(): boolean {
    return this.type === 'password';
  }

  get inputType(): string {
    return this.isPassword ? (this.hide ? 'password' : 'text') : this.type;
  }

  get errorMessage(): string | null {
    const control = this.control;
    if (!control || !control.touched) return null;

    const matched = this.validationErrors.find(e => control.hasError(e.type));
    return matched?.message ?? null;
  }

  get describedBy(): string | null {
    if (this.pending) return `${this.controlName}-pending`;
    return this.errorMessage ? `${this.controlName}-error` : null;
  }

  onBlur(): void {
    const control = this.control;
    if (!control) return;

    control.markAsTouched();

    if (!this.remoteValidator) return;

    const value = this.normalize(control.value);

    // مقدار خالی → بررسی نکن (خطای required کار خودش را می‌کند)
    if (!value) {
      this.lastCheckedValue = UNSET;
      this.applyRemoteErrors(null);
      return;
    }

    // خطای سینک دارد → درخواست بی‌فایده است
    if (this.hasSyncErrors()) return;

    // همین مقدار قبلاً بررسی شده
    if (value === this.lastCheckedValue) return;

    this.lastCheckedValue = value;
    this.blur$.next(value);
  }

  /** trim + یکسان‌سازی ی/ک در صورت فعال بودن */
  private normalize(raw: any): string {
    const value = (raw ?? '').toString().trim();
    return this.normalizePersian
      ? value.replace(/\u064A/g, '\u06CC').replace(/\u0643/g, '\u06A9')
      : value;
  }

  /** آیا خطایی غیر از خطاهای سرور روی کنترل هست؟ */
  private hasSyncErrors(): boolean {
    const errors = this.control?.errors;
    if (!errors) return false;
    return Object.keys(errors).some(k => !this.remoteErrorKeys.includes(k));
  }

  /** خطاهای سرور را با خطاهای موجود ادغام می‌کند */
  private applyRemoteErrors(errors: ValidationErrors | null): void {
    const control = this.control;
    if (!control) return;

    // فقط کلیدهایی که واقعاً خطا هستند (جلوگیری از { key: false })
    const incoming: ValidationErrors = {};
    if (errors) {
      for (const [key, val] of Object.entries(errors)) {
        if (val) incoming[key] = val;
      }
    }

    const current: ValidationErrors = { ...(control.errors ?? {}) };
    this.remoteErrorKeys.forEach(key => delete current[key]);

    this.remoteErrorKeys = Object.keys(incoming);

    const merged = { ...current, ...incoming };
    control.setErrors(Object.keys(merged).length ? merged : null, { emitEvent: false });
  }
}
