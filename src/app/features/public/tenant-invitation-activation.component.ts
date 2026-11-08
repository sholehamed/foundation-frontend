import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { isTenantWorkspaceHost } from '../../shared/util/tenant-workspace-host';
import { takeInvitationToken } from '../../shared/util/tenant-invitation-token';
import { activationRequestOptions } from '../../shared/util/tenant-invitation-activation-request';

/**
 * Public, cookie-free redemption. The initial token is captured in main.ts
 * before Angular bootstraps and is never in Router URL/history/storage.
 */
@Component({
  selector: 'app-tenant-invitation-activation',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, RouterLink],
  template: `
    <section class="invitation-activation" dir="rtl">
      <div class="invitation-activation-card">
        <p class="eyebrow">FOUNDATION · TENANT</p>
        <h1>فعال‌سازی حساب کارمند</h1>
        <p>برای فعال‌شدن حساب، یک رمز عبور جدید تعیین کنید. این لینک فقط یک‌بار و حداکثر ۳۰ دقیقه معتبر است.</p>
        @if (error()) { <p role="alert" class="activation-error">{{ error() }}</p> }
        @if (activated()) {
          <p role="status">حساب شما فعال شد. اکنون می‌توانید از صفحه ورود، وارد فضای کاری شوید.</p>
          <a mat-flat-button routerLink="/auth/login">ورود به فضای کاری</a>
        } @else if (ready()) {
          <form [formGroup]="form" (ngSubmit)="activate()">
            <mat-form-field appearance="outline">
              <mat-label>رمز عبور جدید</mat-label>
              <input matInput type="password" formControlName="password"
                autocomplete="new-password" [disabled]="saving()" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>تکرار رمز عبور</mat-label>
              <input matInput type="password" formControlName="confirm"
                autocomplete="new-password" [disabled]="saving()" />
            </mat-form-field>
            <p>رمز حداقل ۱۲ کاراکتر، شامل حرف بزرگ و کوچک انگلیسی، عدد و نماد باشد.</p>
            <button mat-flat-button type="submit"
              [disabled]="form.invalid || saving()">
              {{ saving() ? 'در حال فعال‌سازی...' : 'فعال‌سازی حساب' }}
            </button>
          </form>
        } @else {
          <p>لینک فعال‌سازی معتبر نیست. از مدیر فضای کاری درخواست ارسال دوباره کنید.</p>
        }
      </div>
    </section>
  `,
  styles: [`
    :host{display:block;min-height:100vh;background:#f7f4f7;font-family:inherit}
    .invitation-activation{min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box}
    .invitation-activation-card{width:min(100%,470px);background:white;border:1px solid #e9dfe6;
      border-radius:20px;padding:30px;box-shadow:0 14px 40px rgba(36,24,36,.05)}
    h1{font-size:24px;color:#48303b}
    p{font-size:13px;line-height:1.9;color:#6a6271}
    .eyebrow{font-size:11px;color:#99596e;letter-spacing:1.2px}
    form{display:grid;gap:12px;margin-top:22px}
    mat-form-field{width:100%}
    .activation-error{color:#aa3434}
  `],
})
export class TenantInvitationActivationComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private requestAbort: AbortController | null = null;
  constructor() {
    this.destroyRef.onDestroy(() => this.requestAbort?.abort());
  }
  private token: string | null = null;
  private tenantSlug: string | null = null;
  readonly ready = signal(false);
  readonly saving = signal(false);
  readonly activated = signal(false);
  readonly error = signal('');

  readonly form = new FormGroup({
    password: new FormControl('', {
      nonNullable: true, validators: [Validators.required, Validators.minLength(12), Validators.maxLength(128)],
    }),
    confirm: new FormControl('', {
      nonNullable: true, validators: [Validators.required],
    }),
  });

  ngOnInit(): void {
    const host = window.location.hostname.toLowerCase();
    const base = environment.workspaceBaseDomain.toLowerCase();
    this.token = takeInvitationToken();
    // A staff activation link MUST be on the exact Tenant host, not on
    // Identity, System Admin, root, or an arbitrary cross-origin frontend.
    if (!isTenantWorkspaceHost(host, base) || !this.token) {
      this.token = null;
      return;
    }
    const apiOrigin = new URL(environment.apiUrl, window.location.origin).origin;
    if (apiOrigin !== window.location.origin) {
      this.token = null;
      this.error.set('برای فعال‌سازی، اتصال امن API از همان دامنه فضای کاری لازم است.');
      return;
    }
    this.tenantSlug = host.slice(0, -(base.length + 1));
    this.ready.set(true);
  }

  async activate(): Promise<void> {
    if (!this.ready() || this.saving() || this.activated() ||
        !this.token || !this.tenantSlug) return;
    this.form.markAllAsTouched();
    const password = this.form.controls.password.value;
    const confirm = this.form.controls.confirm.value;
    if (this.form.invalid || password !== confirm ||
        !/[a-z]/.test(password) || !/[A-Z]/.test(password) ||
        !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password) ||
        /[\x00-\x1F\x7F]/.test(password)) {
      this.error.set('رمز عبور و تکرار آن را بررسی کنید.');
      return;
    }

    this.error.set('');
    this.saving.set(true);
    const controller = new AbortController();
    this.requestAbort = controller;
    try {
      // Unlike withCredentials:false on a same-origin XHR, fetch omit
      // *guarantees* cookies are never sent, including same-origin cookies.
      // No Angular OAuth interceptor, redirect or foreign-origin request
      // can see the invitation token or the new password.
      const response = await fetch(
        environment.apiUrl + '/public/tenant-invitations/activate', {
          ...activationRequestOptions(
            this.tenantSlug, this.token, password, controller.signal,
          ),
        },
      );
      if (controller.signal.aborted) return;
      if (!response.ok) {
        if ([400, 401, 404, 409].includes(response.status)) {
          this.token = null;
          this.ready.set(false);
          this.error.set('لینک دعوت‌نامه نامعتبر، منقضی یا قبلاً استفاده شده است.');
        } else {
          this.error.set(response.status === 429
            ? 'درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.'
            : 'فعال‌سازی تأیید نشد. دوباره تلاش کنید.');
        }
        return;
      }
      const body: { activated?: boolean } = await response.json();
      if (body.activated !== true) {
        this.error.set('پاسخ سرور برای فعال‌سازی معتبر نیست.');
        return;
      }
      this.token = null;
      this.ready.set(false);
      this.activated.set(true);
    } catch {
      if (!controller.signal.aborted)
        this.error.set('ارتباط امن با سرور برقرار نشد. دوباره تلاش کنید.');
    } finally {
      if (!controller.signal.aborted) {
        this.saving.set(false);
        this.form.reset({ password: '', confirm: '' });
      }
      if (this.requestAbort === controller) this.requestAbort = null;
    }
  }
}
