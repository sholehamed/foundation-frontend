import { Component, inject, Input, ViewChild } from '@angular/core';
import { Route, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';

import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { environment } from '../../../../../environments/environment';
import { CaptchaComponent } from '../../../components/share-captcha/share-captcha.component';
import { AuthService } from '../../../services/auth.service';
import { CustomInputComponent } from '../../../components/input-string.component';
import { CustomizerSettingsService } from '../../../services/customizer-settings.service';




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
@Input()login_context:string='tenant'
@Input() returnUrl!:string
router:Router=inject(Router)
  readonly registrationUrl =
    window.location.protocol + '//' + environment.workspaceBaseDomain +
    (window.location.port ? ':' + window.location.port : '') + '/start';

  get hasJustRegistered(): boolean {
    return this.router.parseUrl(this.router.url).queryParams['registered'] === '1' &&
      this.login_context === 'tenant';
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
  ) {}

  onCaptchaTokenChange(token: string): void {
    this.captchaToken = token;
  }

  GetToken(): void {
    this.submitted = true;
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid || !this.captchaToken) {
      return;
    }

    const username = this.loginForm.controls.username.value;
    const password = this.loginForm.controls.password.value;
    const captchaCode = this.loginForm.controls.captchaCode.value;

    this.authService.login(
      username,
      password,
      captchaCode,
      this.captchaToken,this.login_context
    ).subscribe({
  next: user => {

    if (user.account_type !== this.login_context) {
      this.authService.logout();
      // Show invalid account context message.
      return;
    }

    void this.router.navigateByUrl(
      this.getRedirectUrl(),
      { replaceUrl: true }
    );
  },

  error: error => {
    this.loginForm.controls.captchaCode.setValue('');
    this.captchaToken = '';
    this.captchaComponent?.reload();
  }
});
  }
}
