import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { CustomizerSettingsService } from '../../../../../shared/services/customizer-settings.service';
import { PublicPlanCard, PublicPlanPrice, PublicPlansService } from '../../../shared/public-plans.service';

@Component({
  selector: 'app-plans',
  imports: [MatCardModule, MatButtonModule, RouterLink],
  templateUrl: './plans.component.html',
  styleUrl: './plans.component.scss',
})
export class PlansComponent {
  private readonly api = inject(PublicPlansService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly plans = signal<PublicPlanCard[]>([]);

  constructor(public themeService: CustomizerSettingsService) {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.api.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (rows) => {
        // Never advertise a price without a real, currently offered cycle.
        this.plans.set(rows.filter(x => this.price(x) !== null));
        this.loading.set(false);
      },
      error: () => {
        this.plans.set([]);
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  price(plan: PublicPlanCard): PublicPlanPrice | null {
    return plan.prices.find(x => x.billingCycle === 'monthly')
      ?? plan.prices.find(x => x.billingCycle === 'yearly')
      ?? null;
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(amount);
  }

  currency(currency: string): string {
    return currency === 'IRR' ? 'ریال' : currency;
  }

  cycle(cycle: string): string {
    return cycle === 'monthly' ? 'ماه' : cycle === 'yearly' ? 'سال' : cycle;
  }
}
