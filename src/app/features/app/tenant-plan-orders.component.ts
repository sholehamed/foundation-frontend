import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, finalize } from 'rxjs';
import { PublicPlanCard, PublicPlansService } from '../public/shared/public-plans.service';
import { TenantPlanOrder, TenantWorkspaceService } from './tenant-workspace.service';

/** Owner-only commercial checkout. A quote is NOT a settlement or license. */
@Component({
  selector: 'app-tenant-plan-orders',
  standalone: true,
  imports: [FormsModule, MatButtonModule],
  templateUrl: './tenant-plan-orders.component.html',
  styleUrl: './tenant-workspace.styles.scss',
})
export class TenantPlanOrdersComponent {
  private readonly api = inject(TenantWorkspaceService);
  private readonly catalog = inject(PublicPlansService);
  private readonly destroy = inject(DestroyRef);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly notOwner = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly plans = signal<PublicPlanCard[]>([]);
  readonly orders = signal<TenantPlanOrder[]>([]);
  private checkoutSelection = '';
  private checkoutRequestKey: string | null = null;
  selectedVersion = '';
  selectedCycle: 'monthly' | 'yearly' = 'monthly';

  constructor() { this.refresh(); }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      plans: this.catalog.list(),
      orders: this.api.listMyPlanOrders(),
    }).pipe(takeUntilDestroyed(this.destroy), finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ plans, orders }) => {
          this.plans.set(plans.filter(p => p.prices.some(x =>
            x.currency === 'IRR' && x.amount > 0 &&
            (x.billingCycle === 'monthly' || x.billingCycle === 'yearly'))));
          this.orders.set(orders);
          if (!this.plans().some(x => x.versionId === this.selectedVersion))
            this.selectedVersion = this.plans()[0]?.versionId ?? '';
          this.selectOffer();
        },
        error: err => {
          if (err.status === 403) { this.notOwner.set(true); return; }
          this.error.set('دریافت سفارش‌ها یا پلن‌ها ناموفق بود.');
        },
      });
  }

  offeredCycles(): Array<'monthly' | 'yearly'> {
    return (this.plans().find(x => x.versionId === this.selectedVersion)
      ?.prices ?? [])
      .filter(x => x.currency === 'IRR' && x.amount > 0)
      .map(x => x.billingCycle)
      .filter((x): x is 'monthly' | 'yearly' => x === 'monthly' || x === 'yearly');
  }

  selectOffer(): void {
    if (!this.offeredCycles().includes(this.selectedCycle))
      this.selectedCycle = this.offeredCycles()[0] ?? 'monthly';
  }

  selectedOfferAmount(): number | null {
    return this.plans().find(x => x.versionId === this.selectedVersion)
      ?.prices.find(x => x.billingCycle === this.selectedCycle && x.currency === 'IRR')
      ?.amount ?? null;
  }

  placeOrder(): void {
    if (this.busy() || !this.selectedVersion || !(this.selectedOfferAmount()! > 0)) return;
    const currentSelection = this.selectedVersion + '/' + this.selectedCycle;
    if (this.checkoutSelection !== currentSelection) {
      this.checkoutRequestKey = globalThis.crypto?.randomUUID?.() ?? null;
      this.checkoutSelection = currentSelection;
    }
    const id = this.checkoutRequestKey;
    if (!id) { this.error.set('مرورگر از شناسه امن درخواست پشتیبانی نمی‌کند.'); return; }
    this.busy.set(true);
    this.error.set(null);
    this.message.set(null);
    this.api.createMyPlanOrder(this.selectedVersion, this.selectedCycle, id)
      .pipe(takeUntilDestroyed(this.destroy), finalize(() => this.busy.set(false)))
      .subscribe({
        next: result => {
          if (!result.ok || !result.order) {
            this.error.set('ثبت سفارش رد شد: ' + result.code); return;
          }
          this.message.set('سفارش ثبت شد و در انتظار تسویه معتبر است؛ هیچ اشتراکی فعال نشده است.');
          this.api.listMyPlanOrders().pipe(takeUntilDestroyed(this.destroy))
            .subscribe({ next: orders => this.orders.set(orders) });
        },
        error: err => {
          this.error.set(err.status === 409 ?
            'سفارش قابل ثبت نیست؛ اعتبار پلن یا وضعیت اشتراک را بررسی کنید.' :
            'ثبت سفارش ناموفق بود.');
        },
      });
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(value);
  }
}
