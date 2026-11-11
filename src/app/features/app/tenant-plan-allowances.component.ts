import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TenantCommercialEntitlementSnapshot } from './tenant-workspace.service';

type Allowance = TenantCommercialEntitlementSnapshot['capabilities'][number];

/**
 * FR-17C-3A Angular: read-only effective published PlanVersion allowances.
 * This component deliberately DOES NOT claim measured usage or remaining
 * capacity: the subscription snapshot has no authoritative usage counters.
 */
@Component({
  selector: 'app-tenant-plan-allowances',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="tenant-allowances tenant-panel" aria-labelledby="tenant-allowances-title">
      <div class="tenant-allowances-heading">
        <div>
          <h2 id="tenant-allowances-title">قابلیت‌ها و سقف‌های اشتراک</h2>
          <p>مقادیر تأییدشده پلن فعال، دریافت‌شده از سرور</p>
        </div>
        <span class="tenant-allowances-tag">فقط نمایش</span>
      </div>

      @if (capabilities.length === 0) {
        <p class="tenant-allowances-empty">هیچ قابلیت یا سقف اختصاصی برای این پلن ثبت نشده است.</p>
      } @else {
        <div class="tenant-allowances-grid">
          @for (capability of capabilities; track capability.code) {
            <article class="tenant-allowance-item">
              <code dir="ltr">{{ capability.code }}</code>
              <strong>{{ displayValue(capability) }}</strong>
              <small>{{ displayKind(capability) }}</small>
            </article>
          }
        </div>
      }
      <p class="tenant-allowances-notice">
        این مقادیر، سقف‌های پلن هستند؛ میزان مصرف فعلی و ظرفیت باقی‌مانده هنوز در این بخش گزارش نمی‌شود.
        استفاده از هر قابلیت علاوه بر اشتراک فعال، به مجوز کاربر نیز وابسته است.
      </p>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .tenant-allowances { margin-top: 20px; }
    .tenant-allowances-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
    .tenant-allowances-heading h2 { font-size: 19px; margin: 0 0 6px; }
    .tenant-allowances-heading p { font-size: 12px; color: var(--bodyColor,#777985); margin: 0; }
    .tenant-allowances-tag { background: #f6e9ed; color: #8d4f65; border-radius: 99px; padding: 6px 11px; font-size: 11px; }
    .tenant-allowances-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap: 12px; margin: 18px 0; }
    .tenant-allowance-item { display: flex; min-width: 0; flex-direction: column; gap: 9px; padding: 16px; border: 1px solid var(--borderColor,#e6e5ed); border-radius: 12px; background: var(--bodyBackgroundColor,#faf9fb); }
    .tenant-allowance-item code { font-size: 11px; overflow-wrap: anywhere; color: var(--bodyColor,#777985); text-align: start; }
    .tenant-allowance-item strong { font-size: 17px; color: var(--headingColor,#272936); line-height: 1.5; overflow-wrap: anywhere; }
    .tenant-allowance-item small { font-size: 11px; color: var(--bodyColor,#777985); }
    .tenant-allowances-empty { margin-top: 16px; }
    .tenant-allowances-notice { margin-top: 12px !important; font-size: 12px !important; line-height: 2 !important; color: var(--bodyColor,#777985); }
    @media(max-width:610px){.tenant-allowances-grid{grid-template-columns:1fr;}}
  `],
})
export class TenantPlanAllowancesComponent {
  @Input({ required: true }) capabilities: Allowance[] = [];

  displayValue(item: Allowance): string {
    if (item.isUnlimited) return 'نامحدود';
    if (item.integerValue !== null) return String(item.integerValue);
    if (item.booleanValue === true) return 'فعال';
    if (item.booleanValue === false) return 'غیرفعال';
    if (item.modes?.length) return item.modes.join('، ');
    return 'مقدار نامشخص';
  }

  displayKind(item: Allowance): string {
    if (item.isUnlimited || item.integerValue !== null) return 'مقدار مجاز در پلن';
    if (item.booleanValue !== null) return 'وضعیت قابلیت';
    if (item.modes?.length) return 'حالت‌های مجاز';
    return 'قابلیت بدون مقدار معتبر';
  }
}
