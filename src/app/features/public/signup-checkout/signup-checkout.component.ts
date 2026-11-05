import { CommonModule } from '@angular/common'
import { Component, DestroyRef, inject, signal, ViewChild } from '@angular/core'
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { HttpErrorResponse } from '@angular/common/http'
import { environment } from '../../../../environments/environment'
import { CaptchaComponent } from '../../../shared/components/share-captcha/share-captcha.component'
import { finalize } from 'rxjs'

import { MatButtonModule } from '@angular/material/button'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'

import {
  BillingCycle,
  CheckoutPlan,
  SignupCheckoutPayload,
  SignupCheckoutResponse,
  SignupCheckoutService,
} from './signup-checkout.service'

const matchFields = (first: string, second: string): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const a = control.get(first)?.value
    const b = control.get(second)?.value
    return a && b && a !== b ? { fieldsMismatch: true } : null
  }
}

@Component({
  selector: 'app-signup-checkout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    CaptchaComponent,
  ],
  templateUrl: './signup-checkout.component.html',
  styleUrl: './signup-checkout.component.scss',
})
export class SignupCheckoutComponent {
  private readonly fb = inject(FormBuilder)
  private readonly route = inject(ActivatedRoute)
  private readonly destroyRef = inject(DestroyRef)
  private readonly checkoutService = inject(SignupCheckoutService)

  readonly currentStep = signal(0)
  readonly submitting = signal(false)
  readonly signupError = signal<string | null>(null)
  readonly checkingSlug = signal(false)
  readonly signupResult = signal<SignupCheckoutResponse | null>(null)
  private captchaToken = ''
  @ViewChild(CaptchaComponent) captchaComponent?: CaptchaComponent

  onCaptchaTokenChange(token: string): void {
    this.captchaToken = token
  }

  readonly steps = [
    { title: 'انتخاب پلن', subtitle: 'پلن و دوره پرداخت' },
    { title: 'حساب مالک', subtitle: 'اطلاعات ورود و تماس' },
    { title: 'کسب‌وکار', subtitle: 'فضای کاری و شعبه' },
    { title: 'مرور و ساخت', subtitle: 'ایجاد حساب و فضای کاری' },
  ]

  // Display-only indicative prices; the backend provisions without billing/activation.
  readonly plans: CheckoutPlan[] = [
    {
      key: 'solo',
      title: 'انفرادی',
      subtitle: 'برای متخصص مستقل',
      monthlyPrice: 690_000,
      yearlyPrice: 6_900_000,
      badge: null,
      branchLimit: 1,
      features: ['مدیریت نوبت‌ها', 'مشتریان', 'خدمات', 'گزارش پایه'],
    },
    {
      key: 'solo-pro',
      title: 'انفرادی حرفه‌ای',
      subtitle: 'برای رشد جدی‌تر',
      monthlyPrice: 990_000,
      yearlyPrice: 9_900_000,
      badge: 'پیشنهادی',
      branchLimit: 1,
      features: [
        'همه امکانات انفرادی',
        'گزارش پیشرفته',
        'اتوماسیون بیشتر',
        'پشتیبانی اولویت‌دار',
      ],
    },
    {
      key: 'salon',
      title: 'سالن',
      subtitle: 'برای تیم و سالن',
      monthlyPrice: 1_490_000,
      yearlyPrice: 14_900_000,
      badge: null,
      branchLimit: 1,
      features: ['پرسنل', 'شیفت و برنامه کاری', 'داشبورد مدیریتی', 'گزارش فروش'],
    },
    {
      key: 'salon-pro',
      title: 'سالن حرفه‌ای',
      subtitle: 'برای مجموعه‌های چندشعبه‌ای',
      monthlyPrice: 2_290_000,
      yearlyPrice: 22_900_000,
      badge: 'کامل',
      branchLimit: 5,
      features: ['همه امکانات سالن', 'چند شعبه', 'گزارش تجمیعی', 'قابلیت‌های حرفه‌ای'],
    },
  ]

  readonly form = this.fb.nonNullable.group({
    subscription: this.fb.nonNullable.group({
      planKey: ['solo-pro', Validators.required],
      billingCycle: ['monthly' as BillingCycle, Validators.required],
      promoCode: [''],
    }),

    owner: this.fb.nonNullable.group(
      {
        firstName: ['', [Validators.required, Validators.maxLength(60)]],
        lastName: ['', [Validators.required, Validators.maxLength(80)]],
        mobile: ['', [Validators.required, Validators.pattern(/^09\d{9}$/)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: matchFields('password', 'confirmPassword') }
    ),

    business: this.fb.nonNullable.group({
      displayName: ['', [Validators.required, Validators.maxLength(120)]],
      activityType: ['salon', Validators.required],
      phone: ['', Validators.maxLength(20)],
      city: ['', Validators.required],
      address: ['', [Validators.required, Validators.maxLength(400)]],
      postalCode: ['', Validators.maxLength(20)],
      instagram: ['', Validators.maxLength(80)],
    }),

    workspace: this.fb.nonNullable.group({
      slug: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(40),
          Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        ],
      ],
      culture: ['fa-IR', Validators.required],
      timezone: ['Asia/Tehran', Validators.required],
      currency: ['IRR', Validators.required],
    }),

    branch: this.fb.nonNullable.group({
      enabled: [false],
      name: ['شعبه اصلی'],
      phone: [''],
      city: [''],
      address: [''],
    }),

    legal: this.fb.nonNullable.group({
      acceptTerms: [false, Validators.requiredTrue],
      acceptPrivacy: [false, Validators.requiredTrue],
      captchaCode: ['', Validators.required],
    }),
  })

  constructor() {
    this.applyPlanFromRoute()

    this.form.controls.branch.controls.enabled.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((enabled) => this.applyBranchValidators(enabled))

    this.form.controls.business.controls.displayName.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((name) => {
        const branchName = this.form.controls.branch.controls.name
        if (!branchName.dirty && name?.trim()) {
          branchName.setValue(`شعبه اصلی ${name.trim()}`, { emitEvent: false })
        }
      })
  }

  get selectedPlan(): CheckoutPlan {
    return (
      this.plans.find(
        (x) => x.key === this.form.controls.subscription.controls.planKey.value
      ) ?? this.plans[0]
    )
  }

  get billingCycle(): BillingCycle {
    return this.form.controls.subscription.controls.billingCycle.value
  }

  get selectedPrice(): number {
    return this.billingCycle === 'yearly'
      ? this.selectedPlan.yearlyPrice
      : this.selectedPlan.monthlyPrice
  }

  get hasBranch(): boolean {
    return this.form.controls.branch.controls.enabled.value
  }

  selectPlan(plan: CheckoutPlan): void {
    this.form.controls.subscription.controls.planKey.setValue(plan.key)
  }

  setBillingCycle(cycle: BillingCycle): void {
    this.form.controls.subscription.controls.billingCycle.setValue(cycle)
  }

  goToStep(index: number): void {
    // Allow going backwards freely; forward movement stays validated.
    if (index <= this.currentStep()) {
      this.currentStep.set(index)
    }
  }

  next(): void {
    debugger
    const step = this.currentStep()
    this.signupError.set(null)
    if (!this.validateStep(step)) return

    if (step === 2) {
      this.checkingSlug.set(true)
      const slug = this.form.controls.workspace.controls.slug.value
      this.checkoutService
        .isSlugAvailable(slug)
        .pipe(
          finalize(() => this.checkingSlug.set(false)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: ({ available }) => {
            if (!available) {
              this.signupError.set('این آدرس فضای کاری قبلاً ثبت شده یا رزرو شده است.')
              return
            }
            this.advance()
          },
          error: () =>
            this.signupError.set('بررسی آدرس فضای کاری انجام نشد. دوباره تلاش کنید.'),
        })
      return
    }
    this.advance()
  }

  private advance(): void {
    if (this.currentStep() < this.steps.length - 1) {
      this.currentStep.update((step) => step + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  previous(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update((value) => value - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  submit(): void {
    if (this.submitting() || !this.validateStep(3)) return

    this.form.markAllAsTouched()
    if (this.form.invalid) return
    if (!this.captchaToken) {
      this.signupError.set('لطفاً کد امنیتی را دوباره دریافت کنید.')
      return
    }

    this.signupError.set(null)
    this.submitting.set(true)
    this.checkoutService
      .startCheckout(this.buildPayload())
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.signupResult.set(response)
          // No password/token travels in the URL. Login is a separate OAuth flow.
          const baseDomain = environment.workspaceBaseDomain
          const host = `${response.slug}.${baseDomain}`
          const port = window.location.port ? ':' + window.location.port : ''
          const workspaceLogin = `${window.location.protocol}//${host}${port}/auth/login?registered=1`
          window.location.assign(workspaceLogin)
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 409) {
            this.signupError.set(
              'این آدرس قبلاً ثبت شده است. برگردید و آدرس دیگری انتخاب کنید.'
            )
          } else if (error.status === 429) {
            this.signupError.set(
              'درخواست‌های زیادی ارسال شده است. کمی بعد دوباره امتحان کنید.'
            )
          } else if (error.error?.errors?.captchaCode) {
            this.signupError.set('کد امنیتی اشتباه یا منقضی شده است.')
          } else if (error.status === 400) {
            this.signupError.set('اطلاعات ثبت‌نام معتبر نیست. فیلدها را بررسی کنید.')
          } else {
            this.signupError.set(
              'ساخت فضای کاری انجام نشد. اتصال سرور را بررسی و مجدداً تلاش کنید.'
            )
          }
          this.captchaToken = ''
          this.form.controls.legal.controls.captchaCode.setValue('')
          this.captchaComponent?.reload()
        },
      })
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('fa-IR').format(value)
  }

  private applyPlanFromRoute(): void {
    const planFromPath = this.route.snapshot.paramMap.get('plan')
    const planFromQuery = this.route.snapshot.queryParamMap.get('plan')
    const requestedPlan = planFromPath ?? planFromQuery

    if (requestedPlan && this.plans.some((x) => x.key === requestedPlan)) {
      this.form.controls.subscription.controls.planKey.setValue(requestedPlan)
    }
  }

  private validateStep(step: number): boolean {
    switch (step) {
      case 0: {
        const group = this.form.controls.subscription
        group.markAllAsTouched()
        return group.valid
      }

      case 1: {
        const group = this.form.controls.owner
        group.markAllAsTouched()
        return group.valid
      }

      case 2: {
        this.form.controls.business.markAllAsTouched()
        this.form.controls.workspace.markAllAsTouched()

        if (this.hasBranch) {
          this.form.controls.branch.markAllAsTouched()
        }

        return (
          this.form.controls.business.valid &&
          this.form.controls.workspace.valid &&
          (!this.hasBranch || this.form.controls.branch.valid)
        )
      }

      case 3: {
        this.form.controls.legal.markAllAsTouched()
        return this.form.controls.legal.valid
      }

      default:
        return true
    }
  }

  private applyBranchValidators(enabled: boolean): void {
    const branch = this.form.controls.branch.controls
    const controls = [branch.name, branch.phone, branch.city, branch.address]

    controls.forEach((control) => {
      control.clearValidators()
    })

    if (enabled) {
      branch.name.setValidators([Validators.required, Validators.maxLength(120)])
      branch.phone.setValidators([Validators.required, Validators.maxLength(20)])
      branch.city.setValidators([Validators.required, Validators.maxLength(80)])
      branch.address.setValidators([Validators.required, Validators.maxLength(400)])
    }

    controls.forEach((control) => control.updateValueAndValidity({ emitEvent: false }))
  }

  private buildPayload(): SignupCheckoutPayload {
    const raw = this.form.getRawValue()

    return {
      planKey: raw.subscription.planKey,
      billingCycle: raw.subscription.billingCycle,
      promoCode: raw.subscription.promoCode || null,

      tenant: {
        name: raw.business.displayName,
        slug: raw.workspace.slug,
        culture: raw.workspace.culture,
        timezone: raw.workspace.timezone,
        currency: raw.workspace.currency,
      },

      businessProfile: {
        displayName: raw.business.displayName,
        activityType: raw.business.activityType,
        phone: raw.business.phone || null,
        city: raw.business.city,
        address: raw.business.address,
        postalCode: raw.business.postalCode || null,
        instagram: raw.business.instagram || null,
      },

      owner: {
        firstName: raw.owner.firstName,
        lastName: raw.owner.lastName,
        mobile: raw.owner.mobile,
        email: raw.owner.email,
        password: raw.owner.password,
      },

      branch: raw.branch.enabled
        ? {
            name: raw.branch.name,
            phone: raw.branch.phone,
            city: raw.branch.city,
            address: raw.branch.address,
          }
        : null,

      acceptTerms: raw.legal.acceptTerms,
      acceptPrivacy: raw.legal.acceptPrivacy,
      captchaToken: this.captchaToken,
      captchaCode: raw.legal.captchaCode,
    }
  }
}
