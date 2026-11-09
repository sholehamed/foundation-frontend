import { Component, DestroyRef, inject, Input, signal, ViewChild } from '@angular/core';
import { Route, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';

import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { environment } from '../../../../../environments/environment';
import { CaptchaComponent } from '../../../components/share-captcha/share-captcha.component';
import { AuthService, LoginContext } from '../../../services/auth.service';
import { validateBffAuthorizationReturnUrl } from '../../../util/bff-login-continuation';
import { isTenantWorkspaceHost } from '../../../util/tenant-workspace-host';
import { BffTenantSessionService } from '../../../services/bff-tenant-session.service';
import { CustomInputComponent } from '../../../components/input-string.component';
import { CustomizerSettingsService } from '../../../services/customizer-settings.service';
import { firstLoginRequestOptions } from '../../../util/tenant-first-login-request';
import { looksLikeGeneratedInitialPassword, parseTenantLoginDecision } from '../../../util/tenant-login-decision';




@Component({
  selector: 'app-sign-in',
  standalone: true,
  providers: [AuthService],
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    CustomInputComponent,
    CaptchaComponent,
    
],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss',
})
export class SignInComponent {
  @ViewChild(CaptchaComponent) captchaComponent?: CaptchaComponent;
@Input() login_context: LoginContext = 'tenant';
@Input() returnUrl?: string;
@Input() tenant?: string;

loginError = '';
router:Router=inject(Router)
  readonly registrationUrl =
    window.location.protocol + '//' + environment.workspaceBaseDomain +
    (window.location.port ? ':' + window.location.port : '') + '/start';

  get canUseFirstLogin(): boolean {
    return environment.tenantFirstLoginEnabled &&
      this.login_context === 'tenant' &&
      isTenantWorkspaceHost(window.location.hostname, environment.workspaceBaseDomain);
  }

  get hasJustChangedPassword(): boolean {
    return this.login_context === 'tenant' &&
      this.router.parseUrl(this.router.url).queryParams['passwordChanged'] === '1';
  }

  get hasJustRegistered(): boolean {
    return this.router.parseUrl(this.router.url).queryParams['registered'] === '1' &&
      this.login_context === 'tenant';
  }

  get bffTenantPilotLogin(): boolean { return environment.bffTenantPilotEnabled &&
    this.login_context === 'tenant' &&
    isTenantWorkspaceHost(window.location.hostname, environment.workspaceBaseDomain); }

  private readonly bffTenantSession = inject(BffTenantSessionService);
  private readonly destroyRef = inject(DestroyRef);
  private firstLoginController: AbortController | null = null;
  private passwordChangeChallenge: string | null = null;

  readonly passwordChangeRequired = signal(false);
  readonly resolvingLogin = signal(false);
  readonly changingPassword = signal(false);

  readonly forcedPasswordForm = new FormGroup({
    newPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(15), Validators.maxLength(128)],
    }),
    confirm: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  private get canResolveFirstLogin(): boolean {
    // BFF pilot currently runs interactive sign-in on a separate Identity
    // host. Never send credentials from there to an arbitrary Tenant origin.
    // Its cutover requires a separate signed OIDC continuation contract.
    return this.canUseFirstLogin && !this.bffTenantPilotLogin &&
      !this.returnUrl?.startsWith('/api/connect/authorize');
  }


  beginBffLogin(): void {
    this.bffTenantSession.login(this.getRedirectUrl());
  }

  AppName = environment.AppName;
  ApiUrl = environment.apiUrl;

  submitted = false;
  captchaToken = '';

  loginForm = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    captchaCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
private getRedirectUrl(): string {
  const context = this.login_context;

  const fallback = context === 'system'
    ? '/system/dashboard'
    : '/dashboard';

  const returnUrl =
    this.returnUrl;

  if (
    !returnUrl ||
    !returnUrl.startsWith('/') ||
    returnUrl.startsWith('//') ||
    returnUrl.includes('\\') ||
    returnUrl.includes('..')
  ) {
    return fallback;
  }

  try {
    const tree = this.router.parseUrl(returnUrl);

    const segments =
      tree.root.children['primary']
        ?.segments.map(x => x.path) ?? [];

    const allowed = context === 'system'
      ? segments[0] === 'system' &&
        segments[1] !== 'auth'
      : segments.length > 0 &&
        segments[0] !== 'system' &&
        segments[0] !== 'auth';

    return allowed ? returnUrl : fallback;
  } catch {
    return fallback;
  }
}
  constructor(
    public themeService: CustomizerSettingsService,
    private authService: AuthService,
  ) {
    this.destroyRef.onDestroy(() => {
      this.firstLoginController?.abort();
      this.passwordChangeChallenge = null;
      this.loginForm.controls.password.reset('');
      this.forcedPasswordForm.reset({ newPassword: '', confirm: '' });
    });
  }

  onCaptchaTokenChange(token: string): void {
    this.captchaToken = token;
  }

  GetToken(): void {
    this.submitted = true;
    this.loginError = '';
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid || !this.captchaToken) {
      return;
    }

    const username = this.loginForm.controls.username.value;
    const password = this.loginForm.controls.password.value;
    const captchaCode = this.loginForm.controls.captchaCode.value;
    // Only the unique server-generated 4x6 initial credential format
    // takes the restricted branch. Conventional logins make no extra
    // request and do not consume the 5/min first-login IP allowance.
    if (this.canResolveFirstLogin &&
        looksLikeGeneratedInitialPassword(password)) {
      void this.resolveLoginBeforeAuthentication(username, password, captchaCode);
      return;
    }
    this.continueNormalLogin(username, password, captchaCode);
  }

  private continueNormalLogin(username: string, password: string, captchaCode: string): void {
    // The only non-application return path accepted by the legacy login UI is
    // the server-validated OpenIddict authorization request for our BFF client.
    if (this.returnUrl?.startsWith('/api/connect/authorize')) {
      const continuation = validateBffAuthorizationReturnUrl(
        this.returnUrl,
        this.login_context,
        this.tenant ?? this.authService.getCurrentTenantSlug(),
        environment.bffClientId,
      );

      if (!continuation) {
        this.loginError = 'درخواست ادامه ورود معتبر نیست. لطفاً فرایند ورود را از برنامه آغاز کنید.';
        return;
      }

      this.authService.interactiveLogin(
        username,
        password,
        captchaCode,
        this.captchaToken,
        this.login_context,
        this.tenant ?? null,
      ).subscribe({
        next: () => window.location.assign(continuation),
        error: () => this.resetCaptcha(),
      });
      return;
    }

    if (environment.bffTenantPilotEnabled) {
      const host = window.location.hostname.toLowerCase();
      const base = environment.workspaceBaseDomain.toLowerCase();
      if (host === 'identity.' + base || host === 'auth.' + base) {
        this.loginError = 'درخواست ورود معتبر نیست. ورود را از صفحه برنامه آغاز کنید.';
        return;
      }
    }

    this.authService.login(
      username,
      password,
      captchaCode,
      this.captchaToken,
      this.login_context,
    ).subscribe({
      next: user => {
        if (user.account_type !== this.login_context) {
          this.authService.logout();
          this.loginError = 'نوع حساب کاربری با این بخش مطابقت ندارد.';
          return;
        }

        void this.router.navigateByUrl(
          this.getRedirectUrl(),
          { replaceUrl: true },
        );
      },
      error: () => this.resetCaptcha(),
    });
  }


  /**
   * Password-change check is server-side and only emits a restricted
   * challenge for a VERIFIED temporary password. The normal authenticator
   * remains the authority for conventional passwords and CAPTCHA.
   */
  private async resolveLoginBeforeAuthentication(
    username: string, password: string, captchaCode: string,
  ): Promise<void> {
    if (this.resolvingLogin() || this.passwordChangeRequired()) return;
    const api = new URL(environment.apiUrl, window.location.origin);
    if (window.location.protocol !== 'https:' ||
        api.origin !== window.location.origin ||
        !this.canResolveFirstLogin) {
      this.loginError = 'ورود اولیه به ارتباط امن API از همان دامنه نیاز دارد.';
      return;
    }

    this.resolvingLogin.set(true);
    const controller = new AbortController();
    this.firstLoginController = controller;
    const base = environment.workspaceBaseDomain.toLowerCase();
    const host = window.location.hostname.toLowerCase();
    const tenantSlug = host.slice(0, -(base.length + 1));
    try {
      const response = await fetch(
        environment.apiUrl + '/public/tenant-login/resolve',
        firstLoginRequestOptions({
          tenantSlug, userName: username, temporaryPassword: password,
        }, controller.signal),
      );
      if (controller.signal.aborted) return;
      if (!response.ok) {
        this.loginError = response.status === 429
          ? 'تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.'
          : 'امکان بررسی امن ورود وجود ندارد؛ دوباره تلاش کنید.';
        this.loginForm.controls.password.reset('');
        this.resetCaptcha();
        return;
      }
      const result = parseTenantLoginDecision(await response.json());
      if (result?.status === 'password_change_required') {
        this.passwordChangeChallenge = result.challenge!;
        this.passwordChangeRequired.set(true);
        this.loginForm.controls.password.reset('');
        this.resetCaptcha();
        this.loginError = '';
        return;
      }
      if (result.status !== 'continue_login') {
        this.loginError = 'پاسخ بررسی ورود معتبر نیست.';
        this.loginForm.controls.password.reset('');
        this.resetCaptcha();
        return;
      }
      // The ordinary Identity/OAuth login path is intentionally unmodified.
      this.continueNormalLogin(username, password, captchaCode);
    } catch {
      if (!controller.signal.aborted) {
        this.loginError = 'ارتباط امن با سرویس ورود برقرار نشد.';
        this.loginForm.controls.password.reset('');
        this.resetCaptcha();
      }
    } finally {
      this.resolvingLogin.set(false);
      if (this.firstLoginController === controller) this.firstLoginController = null;
    }
  }

  async completeRequiredPasswordChange(): Promise<void> {
    if (!this.passwordChangeRequired() || !this.passwordChangeChallenge ||
        this.changingPassword() || !this.canResolveFirstLogin) return;
    this.forcedPasswordForm.markAllAsTouched();
    const newPassword = this.forcedPasswordForm.controls.newPassword.value;
    const confirmation = this.forcedPasswordForm.controls.confirm.value;
    if (this.forcedPasswordForm.invalid || newPassword !== confirmation ||
        /[\x00-\x1F\x7F]/.test(newPassword)) {
      this.loginError = 'رمز جدید و تکرار آن را بررسی کنید.';
      return;
    }
    this.loginError = '';
    this.changingPassword.set(true);
    const controller = new AbortController();
    this.firstLoginController = controller;
    const base = environment.workspaceBaseDomain.toLowerCase();
    const tenantSlug = window.location.hostname.toLowerCase()
      .slice(0, -(base.length + 1));
    try {
      const response = await fetch(
        environment.apiUrl + '/public/tenant-first-login/complete',
        firstLoginRequestOptions({
          tenantSlug, challenge: this.passwordChangeChallenge, newPassword,
        }, controller.signal),
      );
      if (controller.signal.aborted) return;
      if (!response.ok) {
        if ([400, 401, 404, 409].includes(response.status)) {
          this.passwordChangeChallenge = null;
          this.passwordChangeRequired.set(false);
          this.loginError = 'مهلت تغییر رمز تمام شده یا مجوز استفاده شده است. دوباره وارد شوید.';
        } else {
          this.loginError = response.status === 429
            ? 'تعداد درخواست‌ها بیش از حد مجاز است.'
            : 'تغییر رمز تأیید نشد؛ دوباره تلاش کنید.';
        }
        return;
      }
      const data: { passwordChanged?: boolean; requiresRelogin?: boolean } =
        await response.json();
      if (data.passwordChanged !== true || data.requiresRelogin !== true) {
        this.loginError = 'پاسخ تغییر رمز قابل تأیید نیست.';
        return;
      }

      this.passwordChangeChallenge = null;
      this.passwordChangeRequired.set(false);
      this.loginForm.reset({ username: '', password: '', captchaCode: '' });
      this.resetCaptcha();
      // A successful change does NOT create an authenticated app session.
      await this.router.navigate(['/auth/login'], {
        queryParams: { passwordChanged: '1' }, replaceUrl: true,
      });
    } catch {
      if (!controller.signal.aborted)
        this.loginError = 'ارتباط امن با سرویس تغییر رمز برقرار نشد.';
    } finally {
      this.forcedPasswordForm.reset({ newPassword: '', confirm: '' });
      this.changingPassword.set(false);
      if (this.firstLoginController === controller) this.firstLoginController = null;
    }
  }

  private resetCaptcha(): void {
    this.loginForm.controls.captchaCode.setValue('');
    this.captchaToken = '';
    this.captchaComponent?.reload();
  }
}
