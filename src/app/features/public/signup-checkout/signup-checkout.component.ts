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
import { PublicPlansService } from '../shared/public-plans.service'

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
  private readonly plansApi = inject(PublicPlansService)

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

  // Only published server catalog rows are purchasable selections. The
  // legacy 'unselected' choice is onboarding *without* an active subscription.
  readonly plans = signal<CheckoutPlan[]>([])
  readonly plansLoading = signal(true)
  readonly plansFailed = signal(false)
  readonly choosingWithoutPlan = signal(false)

  readonly form = this.fb.nonNullable.group({
    subscription: this.fb.nonNullable.group({
      planKey: ['', Validators.required],
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
    this.loadPublishedPlans()

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

  get selectedPlan(): CheckoutPlan | null {
    return this.plans().find(
      x => x.key === this.form.controls.subscription.controls.planKey.value
    ) ?? null
  }

  get billingCycle(): BillingCycle {
    return this.form.controls.subscription.controls.billingCycle.value
  }

  get selectedOffer() {
    return this.selectedPlan?.prices.find(x => x.billingCycle === this.billingCycle) ?? null
  }

  get selectedPrice(): number | null {
    return this.selectedOffer?.amount ?? null
  }

  get selectedCurrency(): string {
    return this.selectedOffer?.currency === 'IRR'
      ? 'ریال'
      : this.selectedOffer?.currency ?? ''
  }

  get hasBranch(): boolean {
    return this.form.controls.branch.controls.enabled.value
  }

  selectPlan(plan: CheckoutPlan): void {
    this.form.controls.subscription.controls.planKey.setValue(plan.key)
    if (!plan.prices.some(p => p.billingCycle === this.billingCycle)) {
      this.form.controls.subscription.controls.billingCycle.setValue(
        plan.prices[0].billingCycle as BillingCycle
      )
    }
    this.choosingWithoutPlan.set(false)
    this.signupError.set(null)
  }

  setBillingCycle(cycle: BillingCycle): void {
    if (this.selectedPlan &&
        !this.selectedPlan.prices.some(p => p.billingCycle === cycle)) return
    this.form.controls.subscription.controls.billingCycle.setValue(cycle)
  }

  goToStep(index: number): void {
    // Allow going backwards freely; forward movement stays validated.
    if (index <= this.currentStep()) {
      this.currentStep.set(index)
    }
  }

  next(): void {
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

  private loadPublishedPlans(): void {
    this.plansLoading.set(true)
    this.plansFailed.set(false)
    this.plansApi.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: rows => {
        const choices: CheckoutPlan[] = rows.map(plan => ({
          key: plan.code,
          title: plan.title,
          subtitle: plan.subtitle ?? '',
          badge: plan.badge,
          prices: plan.prices.filter(p => p.billingCycle === 'monthly' || p.billingCycle === 'yearly'),
          branchLimit: null,
          features: plan.features.map(f => f.title),
        })).filter(plan => plan.prices.length > 0)
        this.plans.set(choices)
        this.plansLoading.set(false)
        const request = this.route.snapshot.paramMap.get('plan') ??
          this.route.snapshot.queryParamMap.get('plan')
        const selected = request ? choices.find(p => p.key === request) : choices[0]
        if (selected) {
          this.form.controls.subscription.controls.planKey.setValue(selected.key)
          const requestedCycle = this.route.snapshot.queryParamMap.get('billingCycle')
          const cycle = requestedCycle === 'yearly' || requestedCycle === 'monthly'
            ? requestedCycle
            : 'monthly'
          const offer = selected.prices.find(p => p.billingCycle === cycle)
            ?? selected.prices[0]
          this.form.controls.subscription.controls.billingCycle.setValue(
            offer.billingCycle as BillingCycle
          )
          this.choosingWithoutPlan.set(false)
        } else if (!request && choices.length === 0) {
          // Core signup remains available without advertising a fake price.
          this.chooseWithoutPlan()
        } else {
          // Do not silently change an unrecognized deep-linked PlanKey.
          this.form.controls.subscription.controls.planKey.setValue('')
          this.signupError.set('پلن انتخاب‌شده در کاتالوگ موجود نیست. لطفاً پلن دیگری انتخاب کنید.')
        }
      },
      error: () => {
        this.plans.set([])
        this.plansLoading.set(false)
        this.plansFailed.set(true)
        this.form.controls.subscription.controls.planKey.setValue('')
        this.signupError.set('دریافت پلن‌ها ناموفق بود. برای انتخاب پلن مجدداً تلاش کنید.')
      },
    })
  }

  reloadPlans(): void {
    this.loadPublishedPlans()
  }

  chooseWithoutPlan(): void {
    // The backend records this as signup intent only; no paid entitlements.
    this.form.controls.subscription.controls.planKey.setValue('unselected')
    this.form.controls.subscription.controls.billingCycle.setValue('monthly')
    this.choosingWithoutPlan.set(true)
    this.signupError.set(null)
  }

  private validateStep(step: number): boolean {
    switch (step) {
      case 0: {
        const group = this.form.controls.subscription
        group.markAllAsTouched()
        return group.valid && (this.choosingWithoutPlan() ||
          !!this.selectedPlan?.prices.some(x => x.billingCycle === this.billingCycle))
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
