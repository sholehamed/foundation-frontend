import {
  Component,
  DestroyRef,
  EventEmitter,
  forwardRef,
  inject,
  OnInit,
  Output
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { environment } from '../../../../environments/environment';

interface CaptchaResponse {
  token: string;
  imageUrl: string;
}

@Component({
  selector: 'app-captcha',
  standalone: true,

  imports: [
    CommonModule
  ],

  template: `
    <div
      class="captcha-box"
      dir="rtl"
      [class.is-loading]="loading"
      [class.is-disabled]="disabled"
      [class.has-error]="error"
    >

      <label
        class="captcha-label"
        for="captcha-code"
      >
        کد امنیتی
      </label>

      <div class="captcha-image-row">

        <div
          class="captcha-image-wrapper"
          aria-live="polite"
          aria-busy="{{ loading }}"
        >

          @if (imageUrl && !loading) {
            <img
              [src]="imageUrl"
              alt="تصویر کد امنیتی"
              class="captcha-image"
              draggable="false"
            >
          }

          @if (loading) {
            <div class="captcha-loading">
              <span class="loading-spinner"></span>

              <span>
                در حال دریافت کد...
              </span>
            </div>
          }

          @if (!loading && !imageUrl && error) {
            <div class="captcha-image-error">
              <span class="material-symbols-outlined">
                image_not_supported
              </span>

              <span>
                تصویر دریافت نشد
              </span>
            </div>
          }

        </div>


        <button
          type="button"
          class="captcha-refresh"
          (click)="reload()"
          [disabled]="disabled || loading"
          aria-label="دریافت کد امنیتی جدید"
          title="دریافت کد جدید"
        >
          <span
            class="material-symbols-outlined"
            [class.rotating]="loading"
          >
            refresh
          </span>
        </button>

      </div>


      <div class="captcha-input-wrapper">

        <input
          id="captcha-code"
          type="text"
          class="captcha-input"
          placeholder="کد داخل تصویر را وارد کنید"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          inputmode="text"

          [value]="value"
          [disabled]="disabled || loading"

          [attr.aria-invalid]="!!error"
          [attr.aria-describedby]="error ? 'captcha-error' : null"

          (input)="onInput($any($event.target).value)"
          (blur)="touch()"
        >

        @if (value) {
          <button
            type="button"
            class="captcha-clear"
            tabindex="-1"
            [disabled]="disabled || loading"
            aria-label="پاک کردن کد امنیتی"
            (click)="clear()"
          >
            <span class="material-symbols-outlined">
              close
            </span>
          </button>
        }

      </div>


      @if (error) {
        <div
          id="captcha-error"
          class="captcha-error"
          role="alert"
        >
          <span class="material-symbols-outlined">
            error
          </span>

          <span>
            {{ error }}
          </span>
        </div>
      }

    </div>
  `,

  styles: `
    :host {
      display: block;
      width: 100%;
    }


    /* =====================================================
       Container
    ===================================================== */

    .captcha-box {
      width: 100%;

      font-family: var(--fontFamily);
      color: var(--bodyColor);
    }


    /* =====================================================
       Label
    ===================================================== */

    .captcha-label {
      display: block;

      margin-bottom: 8px;

      color: var(--headingColor);

      font-family: var(--fontFamily);
      font-size: 13px;
      font-weight: 500;

      line-height: 1.6;
    }


    /* =====================================================
       Image + Refresh
    ===================================================== */

    .captcha-image-row {
      display: flex;
      align-items: stretch;

      gap: 10px;

      margin-bottom: 12px;
    }


    .captcha-image-wrapper {
      position: relative;

      flex: 1;

      min-width: 0;
      height: 64px;

      display: flex;
      align-items: center;
      justify-content: center;

      overflow: hidden;

      padding: 5px 10px;

      border: 1px solid var(--borderColor);
      border-radius: 12px;

      background-color: var(--surfaceColor);

      transition:
        border-color var(--transition),
        background-color var(--transition);
    }


    .captcha-image {
      display: block;

      max-width: 100%;
      max-height: 52px;

      width: auto;
      height: auto;

      object-fit: contain;

      user-select: none;
      pointer-events: none;

      border-radius: 6px;
    }


    /* =====================================================
       Loading
    ===================================================== */

    .captcha-loading {
      display: flex;
      align-items: center;
      justify-content: center;

      gap: 8px;

      color: var(--mutedColor);

      font-size: 12px;
    }


    .loading-spinner {
      width: 16px;
      height: 16px;

      border: 2px solid var(--borderColor);
      border-top-color: var(--primaryColor);
      border-radius: 50%;

      animation: captcha-spin 0.7s linear infinite;
    }


    @keyframes captcha-spin {
      to {
        transform: rotate(360deg);
      }
    }


    /* =====================================================
       Image Error
    ===================================================== */

    .captcha-image-error {
      display: flex;
      align-items: center;

      gap: 7px;

      color: var(--mutedColor);

      font-size: 12px;

      .material-symbols-outlined {
        font-size: 19px;
      }
    }


    /* =====================================================
       Refresh
    ===================================================== */

    .captcha-refresh {
      flex: 0 0 52px;

      width: 52px;
      min-width: 52px;

      display: flex;
      align-items: center;
      justify-content: center;

      padding: 0;

      border: 1px solid var(--borderColor);
      border-radius: 12px;

      color: var(--bodyColor);
      background-color: var(--surfaceColor);

      cursor: pointer;

      transition:
        color 0.2s ease,
        border-color 0.2s ease,
        background-color 0.2s ease,
        transform 0.2s ease;

      .material-symbols-outlined {
        font-size: 23px;

        transition: transform 0.2s ease;
      }

      &:hover:not(:disabled) {
        color: var(--primaryColor);
        border-color: var(--primaryColor);

        transform: translateY(-1px);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
    }


    .rotating {
      animation: captcha-spin 0.75s linear infinite;
    }


    /* =====================================================
       Input
    ===================================================== */

    .captcha-input-wrapper {
      position: relative;

      width: 100%;
    }


    .captcha-input {
      width: 100%;
      height: 48px;

      padding:
        0
        14px
        0
        44px;

      box-sizing: border-box;

      border: 1px solid var(--borderColor);
      border-radius: 12px;
      outline: none;

      color: var(--headingColor);
      background-color: var(--cardBgColor);

      font-family: var(--fontFamily);
      font-size: 14px;
      font-weight: 500;

      /*
       * خود input RTL است، اما کد امنیتی معمولاً
       * ترکیب لاتین/عدد است و بهتر خوانده می‌شود.
       */

      letter-spacing: 2px;

      caret-color: var(--primaryColor);

      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        background-color var(--transition),
        color var(--transition);

      &::placeholder {
        direction: rtl;

        color: var(--mutedColor);

        font-weight: 400;
        letter-spacing: 0;

        opacity: 1;
      }

      &:hover:not(:disabled) {
        border-color:
          color-mix(
            in srgb,
            var(--primaryColor) 50%,
            var(--borderColor)
          );
      }

      &:focus {
        border-color: var(--primaryColor);

        box-shadow:
          0 0 0 3px
          color-mix(
            in srgb,
            var(--primaryColor) 12%,
            transparent
          );
      }

      &:disabled {
        color: var(--mutedColor);
        background-color: var(--surfaceColor);

        cursor: not-allowed;
        opacity: 0.7;
      }
    }


    /* =====================================================
       Clear
    ===================================================== */

    .captcha-clear {
      position: absolute;

      top: 50%;
      left: 9px;

      width: 30px;
      height: 30px;

      display: flex;
      align-items: center;
      justify-content: center;

      padding: 0;

      border: 0;
      border-radius: 8px;

      color: var(--mutedColor);
      background-color: transparent;

      cursor: pointer;

      transform: translateY(-50%);

      transition:
        color 0.2s ease,
        background-color 0.2s ease;

      .material-symbols-outlined {
        font-size: 18px;
      }

      &:hover:not(:disabled) {
        color: var(--primaryColor);
        background-color: var(--surfaceColor);
      }
    }


    /* =====================================================
       Error
    ===================================================== */

    .captcha-error {
      display: flex;
      align-items: center;

      gap: 5px;

      margin-top: 7px;

      color: var(--errorColor);

      font-size: 11px;
      line-height: 1.6;

      .material-symbols-outlined {
        font-size: 16px;
      }
    }


    .captcha-box.has-error {
      .captcha-input {
        border-color: var(--errorColor);

        &:focus {
          box-shadow:
            0 0 0 3px
            color-mix(
              in srgb,
              var(--errorColor) 10%,
              transparent
            );
        }
      }
    }


    /* =====================================================
       Disabled
    ===================================================== */

    .captcha-box.is-disabled {
      .captcha-image-wrapper {
        opacity: 0.65;
      }
    }


    /* =====================================================
       Mobile
    ===================================================== */

    @media only screen and (max-width: 767px) {

      .captcha-image-wrapper {
        height: 58px;
      }

      .captcha-refresh {
        flex-basis: 48px;

        width: 48px;
        min-width: 48px;
      }

      .captcha-input {
        height: 46px;

        font-size: 13px;
      }
    }
  `,

  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CaptchaComponent),
      multi: true
    }
  ]
})
export class CaptchaComponent
  implements OnInit, ControlValueAccessor {

  @Output()
  readonly tokenChange = new EventEmitter<string>();


  imageUrl = '';
  token = '';

  value = '';

  loading = false;
  disabled = false;

  error = '';


  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  private readonly apiBaseUrl =
    environment.apiUrl.replace(/\/+$/, '');


  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};


  ngOnInit(): void {
    this.reload();
  }


  // =====================================================
  // Captcha
  // =====================================================

  reload(): void {

    if (this.disabled || this.loading) {
      return;
    }

    this.loading = true;

    this.error = '';
    this.imageUrl = '';

    this.clearValue(false);


    this.http
      .get<CaptchaResponse>(
        `${this.apiBaseUrl}/system/Auth/captcha/new`
      )
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({

        next: response => {

          if (!response?.token || !response?.imageUrl) {

            this.handleLoadError();

            return;
          }


          this.token = response.token;

          this.imageUrl =
            this.resolveImageUrl(response.imageUrl);

          this.tokenChange.emit(this.token);
        },


        error: () => {
          this.handleLoadError();
        }

      });
  }


  private resolveImageUrl(imageUrl: string): string {

    if (
      imageUrl.startsWith('http://') ||
      imageUrl.startsWith('https://') ||
      imageUrl.startsWith('data:')
    ) {
      return imageUrl;
    }


    return `${this.apiBaseUrl}${
      imageUrl.startsWith('/')
        ? ''
        : '/'
    }${imageUrl}`;
  }


  private handleLoadError(): void {

    this.token = '';
    this.imageUrl = '';

    this.error =
      'دریافت کد امنیتی با خطا مواجه شد. دوباره تلاش کنید.';

    this.tokenChange.emit('');
  }


  // =====================================================
  // Input
  // =====================================================

  onInput(value: string): void {

    /*
     * اگر captcha شما case-sensitive است،
     * اینجا uppercase یا lowercase نکن.
     */

    this.value = value;

    this.error = '';

    this.onChange(this.value);
  }


  clear(): void {
    this.clearValue(true);
  }


  private clearValue(markTouched: boolean): void {

    this.value = '';

    this.onChange('');

    if (markTouched) {
      this.onTouched();
    }
  }


  touch(): void {
    this.onTouched();
  }


  // =====================================================
  // ControlValueAccessor
  // =====================================================

  writeValue(value: string | null): void {
    this.value = value ?? '';
  }


  registerOnChange(
    fn: (value: string) => void
  ): void {

    this.onChange = fn;
  }


  registerOnTouched(
    fn: () => void
  ): void {

    this.onTouched = fn;
  }


  setDisabledState(
    isDisabled: boolean
  ): void {

    this.disabled = isDisabled;
  }
}