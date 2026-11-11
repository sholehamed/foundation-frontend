import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { forkJoin, finalize } from 'rxjs';
import {
  CommercialModuleOption, PlanCatalogRow, PlanDraftContent,
  PlanDraftCreate, PlanDraftDetails, PlanDraftDisplay, PlanDraftPreview,
  SystemPlanCatalogService, SystemPendingPlanOrder,
} from './system-plan-catalog.service';

@Component({
  selector: 'app-system-plan-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule],
  templateUrl: './system-plan-catalog.component.html',
  styleUrl: './system-plan-catalog.component.scss',
})
export class SystemPlanCatalogComponent {
  private readonly api = inject(SystemPlanCatalogService);
  private readonly destroyed = inject(DestroyRef);

  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly plans = signal<PlanCatalogRow[]>([]);
  readonly pendingOrders = signal<SystemPendingPlanOrder[]>([]);
  readonly ordersLoaded = signal(false);
  readonly ordersLoading = signal(false);
  readonly receipts: Record<string, string> = {};
  readonly verifiedReceipt: Record<string, boolean> = {};

  readonly eligibleModules = signal<CommercialModuleOption[]>([]);
  readonly selectedDraft = signal<PlanDraftDetails | null>(null);
  readonly latestPreview = signal<PlanDraftPreview | null>(null);

  readonly newPlan: PlanDraftCreate = {
    code: '', name: '', description: null,
    parentPlanVersionId: null, displayTitle: '', displaySubtitle: null,
  };

  // Editable local copy; never write a published revision through this editor.
  editor: PlanDraftContent | null = null;

  constructor() {
    this.refresh();
  }

  refresh(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      plans: this.api.list(),
      modules: this.api.commercialModules(),
    }).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyed)
    ).subscribe({
      next: result => {
        this.plans.set(result.plans);
        this.eligibleModules.set(result.modules);
      },
      error: error => this.error.set(this.describeError(error)),
    });
  }

  loadPendingOrders(): void {
    if (this.ordersLoading()) return;
    this.ordersLoading.set(true);
    this.error.set(null);
    this.api.pendingOrders().pipe(
      finalize(() => this.ordersLoading.set(false)),
      takeUntilDestroyed(this.destroyed)
    ).subscribe({
      next: rows => {
        this.pendingOrders.set(rows);
        this.ordersLoaded.set(true);
      },
      error: error => this.error.set(this.describeError(error)),
    });
  }

  confirmExternalReceipt(order: SystemPendingPlanOrder): void {
    const receipt = (this.receipts[order.id] ?? '').trim();
    if (this.busy() || !this.verifiedReceipt[order.id] ||
        receipt.length < 6 || receipt.length > 160) {
      this.error.set('شماره رسید معتبر و تأیید بررسی واقعی پرداخت ضروری است.');
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.api.confirmExternalReceipt(order.id, receipt, true).pipe(
      finalize(() => this.busy.set(false)),
      takeUntilDestroyed(this.destroyed)
    ).subscribe({
      next: result => {
        if (!result.ok) {
          this.error.set('تسویه رد شد: ' + result.code);
          return;
        }
        this.notice.set('تأیید دریافت وجه ثبت شد و اشتراک برای همان کسب‌وکار فعال شد.');
        delete this.receipts[order.id];
        delete this.verifiedReceipt[order.id];
        this.loadPendingOrders();
      },
      error: error => this.error.set(this.describeError(error)),
    });
  }

  createPlan(): void {
    if (this.busy()) return;
    if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(this.newPlan.code) ||
        this.newPlan.code.length > 20 ||
        !this.newPlan.name.trim() || !this.newPlan.displayTitle.trim()) {
      this.error.set('کد لاتین کوتاه، نام و عنوان کارت پلن الزامی‌اند.');
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.api.create({
      ...this.newPlan,
      code: this.newPlan.code.trim(),
      name: this.newPlan.name.trim(),
      displayTitle: this.newPlan.displayTitle.trim(),
    }).pipe(
      finalize(() => this.busy.set(false)),
      takeUntilDestroyed(this.destroyed)
    ).subscribe({
      next: result => {
        if (!result.ok || !result.id) {
          this.error.set('پیش‌نویس ساخته نشد: ' + result.code);
          return;
        }
        this.notice.set('پلن و نسخه پیش‌نویس ایجاد شدند. هنوز برای فروش منتشر نشده‌اند.');
        this.newPlan.code = '';
        this.newPlan.name = '';
        this.newPlan.displayTitle = '';
        this.newPlan.parentPlanVersionId = null;
        this.refresh();
        this.openDraft(result.id);
      },
      error: error => this.error.set(this.describeError(error)),
    });
  }

  createRevision(plan: PlanCatalogRow): void {
    if (this.busy() || plan.draftVersionId || !plan.latestPublishedVersionId) return;
    this.busy.set(true);
    this.error.set(null);
    this.api.createRevision(plan.id).pipe(
      finalize(() => this.busy.set(false)),
      takeUntilDestroyed(this.destroyed)
    ).subscribe({
      next: result => {
        if (!result.ok || !result.id) {
          this.error.set('ایجاد نسخه جدید ممکن نبود: ' + result.code);
          return;
        }
        this.notice.set('یک نسخه پیش‌نویس مستقل از نسخه منتشرشده ساخته شد.');
        this.refresh();
        this.openDraft(result.id);
      },
      error: error => this.error.set(this.describeError(error)),
    });
  }

  openDraft(id: string): void {
    this.error.set(null);
    this.latestPreview.set(null);
    this.api.readDraft(id).pipe(
      takeUntilDestroyed(this.destroyed)
    ).subscribe({
      next: result => {
        this.selectedDraft.set(result);
        this.editor = structuredClone(result.content);
      },
      error: error => {
        this.selectedDraft.set(null);
        this.editor = null;
        this.error.set(this.describeError(error));
      },
    });
  }

  clearDraft(): void {
    this.selectedDraft.set(null);
    this.editor = null;
    this.latestPreview.set(null);
  }

  invalidatePreview(): void {
    this.latestPreview.set(null);
    this.notice.set(null);
  }

  hasModule(code: string): boolean {
    return this.editor?.moduleCodes.includes(code) ?? false;
  }

  toggleModule(item: CommercialModuleOption): void {
    if (!this.editor) return;
    this.invalidatePreview();
    if (this.hasModule(item.code)) {
      this.editor.moduleCodes = this.editor.moduleCodes.filter(x => x !== item.code);
      this.editor.displayItems = this.editor.displayItems.filter(
        x => x.kind !== 'Module' || x.code !== item.code);
      return;
    }
    this.editor.moduleCodes.push(item.code);
    this.editor.displayItems.push({
      kind: 'Module', code: item.code, title: item.title,
      description: null, isHighlighted: false,
      sortOrder: this.editor.displayItems.length,
    });
  }

  addPrice(): void {
    if (!this.editor) return;
    this.invalidatePreview();
    const used = new Set(this.editor.prices.map(x => x.billingCycle));
    const cycle = used.has('monthly') ? 'yearly' : 'monthly';
    if (used.has(cycle)) return;
    this.editor.prices.push({ billingCycle: cycle, currency: 'IRR', amount: 0 });
  }

  removePrice(index: number): void {
    if (!this.editor) return;
    this.invalidatePreview();
    this.editor.prices.splice(index, 1);
  }

  addBenefit(): void {
    if (!this.editor) return;
    this.invalidatePreview();
    this.editor.displayItems.push({
      kind: 'Benefit', code: null, title: '', description: null,
      isHighlighted: false, sortOrder: this.editor.displayItems.length,
    });
  }

  removeDisplay(index: number): void {
    if (!this.editor) return;
    this.invalidatePreview();
    this.editor.displayItems.splice(index, 1);
  }

  save(): void {
    const selected = this.selectedDraft();
    if (!selected || !this.editor || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.latestPreview.set(null);
    this.api.saveDraft(selected.id, this.editor).pipe(
      finalize(() => this.busy.set(false)),
      takeUntilDestroyed(this.destroyed)
    ).subscribe({
      next: result => {
        if (result.ok) {
          this.notice.set('پیش‌نویس ذخیره شد. برای انتشار، پیش‌نمایش جدید بگیرید.');
          this.openDraft(selected.id);
        } else {
          this.error.set('ذخیره پیش‌نویس رد شد: ' + result.code);
        }
      },
      error: error => this.error.set(this.describeError(error)),
    });
  }

  review(): void {
    const id = this.selectedDraft()?.id;
    if (!id || this.busy()) return;
    this.latestPreview.set(null);
    this.error.set(null);
    this.api.preview(id).pipe(
      takeUntilDestroyed(this.destroyed)
    ).subscribe({
      next: preview => this.latestPreview.set(preview),
      error: error => this.error.set(this.describeError(error)),
    });
  }

  publish(): void {
    const id = this.selectedDraft()?.id;
    const approved = this.latestPreview();
    if (!id || !approved?.canPublish || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.api.publish(id, approved.fingerprint).pipe(
      finalize(() => this.busy.set(false)),
      takeUntilDestroyed(this.destroyed)
    ).subscribe({
      next: outcome => {
        this.latestPreview.set(null);
        if (!outcome.ok) {
          this.error.set('انتشار رد شد: ' + outcome.code +
            '؛ بررسی و پیش‌نمایش را دوباره انجام دهید.');
          return;
        }
        this.notice.set('نسخه پلن منتشر شد. این عمل خرید یا فعال‌سازی اشتراک نیست.');
        this.clearDraft();
        this.refresh();
      },
      error: error => this.error.set(this.describeError(error)),
    });
  }

  private describeError(error: { status?: number }): string {
    if (error.status === 403) return 'این عملیات فقط برای مدیر تأییدشده سیستم مجاز است.';
    if (error.status === 409) return 'کاتالوگ تغییر کرده یا مقادیر معتبر نیستند؛ مجدد بررسی کنید.';
    return 'ارتباط با سرویس مدیریت پلن برقرار نشد.';
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('fa-IR').format(amount);
  }

  trackDisplay(_: number, item: PlanDraftDisplay): string {
    return item.kind + '/' + (item.code ?? item.title);
  }
}
