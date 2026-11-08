import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { environment } from '../../../environments/environment';
import { isTenantWorkspaceHost } from '../../shared/util/tenant-workspace-host';
import { firstLoginRequestOptions } from '../../shared/util/tenant-first-login-request';

/**
 * No normal auth takes place on this screen. A temporary password is verified
 * into a TEN-MINUTE challenge accepted ONLY for /complete, not a JWT or a BFF
 * cookie. Challenge and password are held in component memory, never storage.
 */
@Component({
  selector: 'app-tenant-first-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <main class="first-login-screen" dir="rtl">
      <section class="first-login-card">
        <p class="eyebrow">FOUNDATION · TENANT</p>
        <h1>اولین ورود کارمند</h1>
        @if (step() === 'credentials') {
          <p>رمز اولیه را از مدیر فضای کاری دریافت کنید. در این مرحله هنوز به سامانه وارد نمی‌شوید؛ پس از تأیید رمز باید رمز شخصی خود را تعیین کنید.</p>
          <form [formGroup]="startForm" (ngSubmit)="begin()">
            <mat-form-field appearance="outline">
              <mat-label>نام کاربری</mat-label>
              <input matInput formControlName="userName" autocomplete="username"
                [disabled]="submitting()" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>رمز اولیه</mat-label>
              <input matInput type="password" formControlName="temporaryPassword"
                autocomplete="off" [disabled]="submitting()" />
            </mat-form-field>
            <button mat-flat-button type="submit" [disabled]="submitting() || startForm.invalid">
              {{ submitting() ? 'در حال بررسی...' : 'بررسی رمز اولیه' }}
            </button>
          </form>
        } @else if (step() === 'change') {
          <p>رمز اولیه تأیید شد. برای فعال‌شدن حساب، رمز دائمی تعیین کنید؛ سپس باید از صفحه ورود معمولی دوباره وارد شوید.</p>
          <form [formGroup]="changeForm" (ngSubmit)="changePassword()">
            <mat-form-field appearance="outline">
              <mat-label>رمز شخصی جدید</mat-label>
              <input matInput type="password" formControlName="newPassword"
                autocomplete="new-password" [disabled]="submitting()" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>تکرار رمز جدید</mat-label>
              <input matInput type="password" formControlName="confirm"
                autocomplete="new-password" [disabled]="submitting()" />
            </mat-form-field>
            <p>حداقل ۱۵ کاراکتر؛ از عبارت عبور طولانی و منحصربه‌فرد استفاده کنید. رمز اولیه یا نام کاربری نباشد.</p>
            <button mat-flat-button type="submit"
              [disabled]="submitting() || changeForm.invalid">
              {{ submitting() ? 'در حال ثبت...' : 'ثبت رمز و بازگشت به ورود' }}
            </button>
          </form>
        }
        @if (error()) { <p role="alert" class="error">{{ error() }}</p> }
        <a mat-stroked-button routerLink="/auth/login">بازگشت به ورود معمولی</a>
      </section>
    </main>
  `,
  styles: [`
    :host{display:block;min-height:100vh;background:#f7f4f7;font-family:inherit}
    .first-login-screen{min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box}
    .first-login-card{width:min(100%,470px);padding:30px;background:white;border:1px solid #e9dfe6;
      border-radius:20px;box-shadow:0 14px 40px rgba(36,24,36,.05)}
    h1{font-size:24px;color:#48303b}
    p{font-size:13px;line-height:1.9;color:#6a6271}
    .eyebrow{font-size:11px;color:#99596e;letter-spacing:1.2px}
    form{display:grid;gap:12px;margin-top:22px} mat-form-field{width:100%}
    .error{color:#aa3434} a{margin-top:16px}
  `],
})
export class TenantFirstLoginComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private requestAbort: AbortController | null = null;
  private challenge: string | null = null;
  private tenantSlug: string | null = null;

  readonly step = signal<'credentials' | 'change'>('credentials');
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly ready = signal(false);
  readonly startForm = new FormGroup({
    userName: new FormControl('', {
      nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
    }),
    temporaryPassword: new FormControl('', {
      nonNullable: true, validators: [Validators.required],
    }),
  });
  readonly changeForm = new FormGroup({
    newPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(15), Validators.maxLength(128)],
    }),
    confirm: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.requestAbort?.abort();
      this.challenge = null;
      this.startForm.reset({ userName: '', temporaryPassword: '' });
      this.changeForm.reset({ newPassword: '', confirm: '' });
    });
  }

  ngOnInit(): void {
    const host = window.location.hostname.toLowerCase();
    const base = environment.workspaceBaseDomain.toLowerCase();
    const api = new URL(environment.apiUrl, window.location.origin);
    if (!environment.tenantFirstLoginEnabled ||
        window.location.protocol !== 'https:' ||
        !isTenantWorkspaceHost(host, base) ||
        api.origin !== window.location.origin) {
      this.error.set('ورود اولیه روی این دامنه یا محیط فعال نیست. با مدیر سامانه تماس بگیرید.');
      return;
    }
    this.tenantSlug = host.slice(0, -(base.length + 1));
    this.ready.set(true);
  }

  private async send(path: 'start' | 'complete', data: Record<string, string>):
    Promise<Response> {
    const controller = new AbortController();
    this.requestAbort = controller;
    return fetch(environment.apiUrl + '/public/tenant-first-login/' + path,
      firstLoginRequestOptions(data, controller.signal));
  }

  async begin(): Promise<void> {
    if (!this.ready() || this.submitting() || this.step() !== 'credentials' ||
        this.startForm.invalid || !this.tenantSlug) return;
    this.error.set('');
    this.submitting.set(true);
    try {
      const response = await this.send('start', {
        tenantSlug: this.tenantSlug,
        userName: this.startForm.controls.userName.value.trim(),
        temporaryPassword: this.startForm.controls.temporaryPassword.value,
      });
      if (!response.ok) {
        this.error.set(response.status === 429
          ? 'تعداد تلاش‌ها بیش از حد مجاز است.'
          : 'نام کاربری یا رمز اولیه نامعتبر یا منقضی است. در صورت نیاز از مدیر رمز جدید بخواهید.');
        return;
      }
      const data: { challenge?: string; requiresPasswordChange?: boolean } =
        await response.json();
      if (data.requiresPasswordChange !== true ||
          !/^[A-F0-9]{64}$/.test(data.challenge ?? '')) {
        this.error.set('پاسخ ورود اولیه معتبر نیست.');
        return;
      }
      this.challenge = data.challenge!;
      this.step.set('change');
    } catch {
      this.error.set('برقراری ارتباط امن با سرور ممکن نشد.');
    } finally {
      this.startForm.reset({ userName: '', temporaryPassword: '' });
      this.submitting.set(false);
      this.requestAbort = null;
    }
  }

  async changePassword(): Promise<void> {
    if (!this.ready() || this.submitting() || this.step() !== 'change' ||
        !this.tenantSlug || !this.challenge) return;
    this.changeForm.markAllAsTouched();
    const newPassword = this.changeForm.controls.newPassword.value;
    if (this.changeForm.invalid ||
        newPassword !== this.changeForm.controls.confirm.value ||
        /[\x00-\x1f\x7f]/.test(newPassword)) {
      this.error.set('رمز جدید و تکرار آن را بررسی کنید.');
      return;
    }
    this.error.set('');
    this.submitting.set(true);
    try {
      const response = await this.send('complete', {
        tenantSlug: this.tenantSlug, challenge: this.challenge, newPassword,
      });
      if (!response.ok) {
        if ([400, 401, 404].includes(response.status)) {
          this.challenge = null;
          this.step.set('credentials');
          this.error.set('مجوز تغییر رمز منقضی یا استفاده شده است؛ ورود اولیه را دوباره آغاز کنید.');
        } else {
          this.error.set(response.status === 429
            ? 'درخواست‌های بیش از حد مجاز؛ کمی بعد دوباره تلاش کنید.'
            : 'تغییر رمز تأیید نشد. دوباره تلاش کنید.');
        }
        return;
      }
      const result: { passwordChanged?: boolean; requiresRelogin?: boolean } =
        await response.json();
      if (result.passwordChanged !== true || result.requiresRelogin !== true) {
        this.error.set('نتیجه سرور قابل تأیید نیست.');
        return;
      }
      this.challenge = null;
      this.ready.set(false);
      // No bearer, no session, no continuation after password change.
      await this.router.navigate(['/auth/login'], {
        queryParams: { passwordChanged: '1' }, replaceUrl: true,
      });
    } catch {
      this.error.set('تغییر رمز تأیید نشد. دوباره تلاش کنید.');
    } finally {
      this.changeForm.reset({ newPassword: '', confirm: '' });
      this.submitting.set(false);
      this.requestAbort = null;
    }
  }
}
