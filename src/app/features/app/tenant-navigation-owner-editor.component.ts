import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import {
  TenantOwnedMenuCatalog, TenantOwnedMenuCategory, TenantOwnedMenuItem,
  TenantOwnedMenuEditorService,
} from './tenant-owned-menu-editor.service';

/**
 * Restricted Tenant Owner settings page. Navigation-only metadata; never
 * a permission editor, Tenant selector, or a generic global Menu CRUD form.
 */
@Component({
  selector: 'app-tenant-navigation-owner-editor',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule],
  styleUrl: './tenant-workspace.styles.scss',
  template: `
    <section class="tenant-panel" dir="rtl">
      <h2>مدیریت منوهای فضای کاری</h2>
      <p>منوهای اختصاصی این فضای کاری را تنظیم کنید. نمایش هر صفحه همچنان به دسترسی واقعی کاربر وابسته است.</p>
      <p><a routerLink="/dashboard">بازگشت به داشبورد</a></p>
      @if (error()) { <p role="alert">{{ error() }}</p> }
      @if (notice()) { <p role="status">{{ notice() }}</p> }
      <button mat-stroked-button type="button" (click)="reload()"
        [disabled]="loading() || saving()">بارگذاری مجدد</button>
      @if (loading()) {
        <p>در حال دریافت منوها...</p>
      } @else {
        <h3>دسته‌بندی‌ها</h3>
        @if (canManage()) {
          <button mat-flat-button type="button" (click)="newCategory()" [disabled]="saving()">
            ایجاد دسته‌بندی
          </button>
        }
        @for (category of categories(); track category.id) {
          <div class="d-flex flex-wrap align-items-center gap-2 my-2">
            <strong>{{ category.title }}</strong>
            <span>ترتیب: {{ category.sortOrder }}</span>
            <span>{{ category.isActive ? 'فعال' : 'غیرفعال' }}</span>
            @if (canManage()) {
              <button mat-stroked-button type="button" [disabled]="saving()"
                (click)="editCategory(category)">ویرایش / ترتیب</button>
              <button mat-stroked-button type="button" [disabled]="saving()"
                (click)="toggleCategory(category)">
                {{ category.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی' }}
              </button>
            }
          </div>
        }

        @if (categoryEditorOpen() && canManage()) {
          <form [formGroup]="categoryForm" (ngSubmit)="saveCategory()">
            <h4>{{ selectedCategory() ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید' }}</h4>
            <label>عنوان
              <input type="text" formControlName="title" maxlength="120" />
            </label>
            <label>ترتیب
              <input type="number" formControlName="sortOrder" min="0" max="10000" />
            </label>
            <button mat-flat-button type="submit" [disabled]="saving() || categoryForm.invalid">
              ذخیره دسته‌بندی
            </button>
            <button mat-button type="button" (click)="cancel()" [disabled]="saving()">انصراف</button>
          </form>
        }

        <hr />
        <h3>آیتم‌های منو</h3>
        @if (canManage() && categories().some(c => c.isActive)) {
          <button mat-flat-button type="button" (click)="newItem()" [disabled]="saving()">
            افزودن آیتم
          </button>
        }
        @for (category of categories(); track category.id) {
          <h4>{{ category.title }}</h4>
          @for (item of itemsOf(category.id); track item.id) {
            <div class="d-flex flex-wrap align-items-center gap-2 my-2">
              <span>{{ item.title }}</span>
              <small>{{ item.route || 'پوشه' }}</small>
              <span>ترتیب: {{ item.sortOrder }}</span>
              <span>{{ item.isActive ? 'فعال' : 'غیرفعال' }}</span>
              @if (canManage() && category.isActive) {
                <button mat-stroked-button type="button" [disabled]="saving()"
                  (click)="editItem(item)">ویرایش / جابه‌جایی</button>
                <button mat-stroked-button type="button" [disabled]="saving()"
                  (click)="toggleItem(item)">
                  {{ item.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی' }}
                </button>
              }
            </div>
          }
        }

        @if (itemEditorOpen() && canManage()) {
          <form [formGroup]="itemForm" (ngSubmit)="saveItem()">
            <h4>{{ selectedItem() ? 'ویرایش آیتم' : 'آیتم جدید' }}</h4>
            <label>دسته‌بندی
              <select formControlName="categoryId">
                @for (category of categories(); track category.id) {
                  @if (category.isActive) {
                    <option [value]="category.id">{{ category.title }}</option>
                  }
                }
              </select>
            </label>
            <label>والد (اختیاری)
              <select formControlName="parentId">
                <option value="">بدون والد</option>
                @for (parent of parentsForSelectedCategory(); track parent.id) {
                  <option [value]="parent.id">{{ parent.title }}</option>
                }
              </select>
            </label>
            <label>عنوان
              <input formControlName="title" maxlength="120" />
            </label>
            <label>آیکن
              <input formControlName="icon" maxlength="80" placeholder="مثلاً home" />
            </label>
            <label>مسیر صفحه
              <select formControlName="route">
                <option value="">پوشه بدون مسیر</option>
                @for (route of allowedRoutes; track route) {
                  <option [value]="route">{{ route }}</option>
                }
              </select>
            </label>
            <label>ترتیب
              <input type="number" formControlName="sortOrder" min="0" max="10000" />
            </label>
            <button mat-flat-button type="submit" [disabled]="saving() || itemForm.invalid">
              ذخیره آیتم
            </button>
            <button mat-button type="button" (click)="cancel()" [disabled]="saving()">انصراف</button>
          </form>
        }
      }
    </section>
  `,
})
export class TenantNavigationOwnerEditorComponent implements OnInit {
  private readonly api = inject(TenantOwnedMenuEditorService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly categories = signal<TenantOwnedMenuCategory[]>([]);
  readonly items = signal<TenantOwnedMenuItem[]>([]);
  readonly canManage = signal(false);
  readonly selectedCategory = signal<TenantOwnedMenuCategory | null>(null);
  readonly selectedItem = signal<TenantOwnedMenuItem | null>(null);
  readonly categoryEditorOpen = signal(false);
  readonly itemEditorOpen = signal(false);

  readonly allowedRoutes = [
    '/dashboard', '/dashboard/business', '/dashboard/branches',
    '/dashboard/members', '/dashboard/roles', '/dashboard/groups',
  ];

  readonly categoryForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    sortOrder: [0, [Validators.required, Validators.min(0), Validators.max(10000)]],
  });
  readonly itemForm = this.fb.nonNullable.group({
    categoryId: ['', [Validators.required]],
    parentId: [''],
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    icon: ['', [Validators.pattern(/^[a-zA-Z0-9_-]*$/), Validators.maxLength(80)]],
    route: [''],
    sortOrder: [0, [Validators.required, Validators.min(0), Validators.max(10000)]],
  });

  ngOnInit(): void { this.reload(); }

  reload(): void {
    if (this.loading() && this.categories().length > 0 || this.saving()) return;
    this.loading.set(true);
    this.error.set(null);
    this.api.get().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: catalog => {
        if (!this.valid(catalog)) {
          this.error.set('پاسخ تنظیمات منو معتبر نیست.');
          this.categories.set([]);
          this.items.set([]);
          this.canManage.set(false);
        } else {
          this.categories.set(catalog.categories);
          this.items.set(catalog.items);
          this.canManage.set(catalog.canManage);
        }
        this.loading.set(false);
      },
      error: (err: { status?: number }) => {
        this.categories.set([]);
        this.items.set([]);
        this.canManage.set(false);
        this.loading.set(false);
        this.error.set(err.status === 403
          ? 'دسترسی به تنظیمات منو فعال نیست یا مجوز آن لغو شده است.'
          : 'دریافت منوهای فضای کاری انجام نشد.');
      },
    });
  }

  private valid(value: TenantOwnedMenuCatalog | null): value is TenantOwnedMenuCatalog {
    return !!value && Array.isArray(value.categories) &&
      Array.isArray(value.items) && typeof value.canManage === 'boolean' &&
      value.categories.every(x => !!x.id && !!x.version) &&
      value.items.every(x => !!x.id && !!x.categoryId && !!x.version);
  }

  itemsOf(categoryId: string): TenantOwnedMenuItem[] {
    return this.items().filter(x => x.categoryId === categoryId);
  }

  parentsForSelectedCategory(): TenantOwnedMenuItem[] {
    const categoryId = this.itemForm.controls.categoryId.value;
    const selected = this.selectedItem();
    // Server validates full ancestor chains and category boundaries.
    return this.items().filter(x => x.categoryId === categoryId &&
      x.isActive && x.id !== selected?.id);
  }

  newCategory(): void {
    if (!this.canManage() || this.saving()) return;
    this.cancel();
    this.categoryForm.reset({ title: '', sortOrder: 0 });
    this.categoryEditorOpen.set(true);
  }

  editCategory(category: TenantOwnedMenuCategory): void {
    if (!this.canManage() || this.saving() || !category.version) return;
    this.cancel();
    this.selectedCategory.set(category);
    this.categoryForm.reset({ title: category.title, sortOrder: category.sortOrder });
    this.categoryEditorOpen.set(true);
  }

  newItem(): void {
    if (!this.canManage() || this.saving()) return;
    const first = this.categories().find(x => x.isActive);
    if (!first) return;
    this.cancel();
    this.itemForm.reset({
      categoryId: first.id, parentId: '', title: '',
      icon: '', route: '', sortOrder: 0,
    });
    this.itemEditorOpen.set(true);
  }

  editItem(item: TenantOwnedMenuItem): void {
    if (!this.canManage() || this.saving() || !item.version) return;
    this.cancel();
    this.selectedItem.set(item);
    this.itemForm.reset({
      categoryId: item.categoryId, parentId: item.parentId ?? '',
      title: item.title, icon: item.icon ?? '',
      route: item.route ?? '', sortOrder: item.sortOrder,
    });
    // Category ownership is immutable. It is not sent on item updates.
    this.itemForm.controls.categoryId.disable();
    this.itemEditorOpen.set(true);
  }

  cancel(): void {
    if (this.saving()) return;
    this.categoryEditorOpen.set(false);
    this.itemEditorOpen.set(false);
    this.selectedCategory.set(null);
    this.selectedItem.set(null);
    this.categoryForm.reset({ title: '', sortOrder: 0 });
    this.itemForm.controls.categoryId.enable();
    this.itemForm.reset({
      categoryId: '', parentId: '', title: '', icon: '', route: '', sortOrder: 0,
    });
  }

  saveCategory(): void {
    if (!this.canManage() || !this.categoryEditorOpen() ||
        this.categoryForm.invalid || this.saving()) return;
    const value = this.categoryForm.getRawValue();
    const input = { title: value.title.trim(), sortOrder: value.sortOrder };
    const target = this.selectedCategory();
    if (target && !target.version) return;
    this.saving.set(true);
    this.error.set(null);
    const request = target
      ? this.api.updateCategory(target.id, {
        ...input, isActive: target.isActive, expectedVersion: target.version,
      })
      : this.api.createCategory(input);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.saved('دسته‌بندی ذخیره شد.'),
      error: err => this.failed(err),
    });
  }

  saveItem(): void {
    if (!this.canManage() || !this.itemEditorOpen() ||
        this.itemForm.invalid || this.saving()) return;
    const raw = this.itemForm.getRawValue();
    const value = {
      parentId: raw.parentId || null,
      title: raw.title.trim(), icon: raw.icon.trim() || null,
      route: raw.route || null, sortOrder: raw.sortOrder,
    };
    const target = this.selectedItem();
    if (target && !target.version) return;
    this.saving.set(true);
    this.error.set(null);
    const request = target
      ? this.api.updateItem(target.id, {
        ...value, isActive: target.isActive, expectedVersion: target.version,
      })
      : this.api.createItem({ ...value, categoryId: raw.categoryId });
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.saved('آیتم منو ذخیره شد.'),
      error: err => this.failed(err),
    });
  }

  toggleCategory(category: TenantOwnedMenuCategory): void {
    if (!this.canManage() || !category.version || this.saving()) return;
    if (!window.confirm(category.isActive
      ? 'دسته‌بندی و تمام آیتم‌های آن از منو پنهان می‌شوند. ادامه می‌دهید؟'
      : 'دسته‌بندی دوباره در منو قابل نمایش می‌شود. ادامه می‌دهید؟')) return;
    this.saving.set(true);
    this.api.updateCategory(category.id, {
      title: category.title, sortOrder: category.sortOrder,
      isActive: !category.isActive, expectedVersion: category.version,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.saved('وضعیت دسته‌بندی تغییر کرد.'),
      error: err => this.failed(err),
    });
  }

  toggleItem(item: TenantOwnedMenuItem): void {
    if (!this.canManage() || !item.version || this.saving()) return;
    if (!window.confirm(item.isActive
      ? 'این آیتم و زیرمنوهای وابسته پنهان می‌شوند. ادامه می‌دهید؟'
      : 'این آیتم دوباره قابل نمایش می‌شود. ادامه می‌دهید؟')) return;
    this.saving.set(true);
    this.api.updateItem(item.id, {
      parentId: item.parentId, title: item.title, icon: item.icon,
      route: item.route, sortOrder: item.sortOrder,
      isActive: !item.isActive, expectedVersion: item.version,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.saved('وضعیت آیتم تغییر کرد.'),
      error: err => this.failed(err),
    });
  }

  private saved(message: string): void {
    this.saving.set(false);
    this.cancel();
    this.notice.set(message);
    this.reload();
  }

  private failed(err: { status?: number }): void {
    this.saving.set(false);
    if (err.status === 409) {
      this.cancel();
      this.notice.set('نسخه منو تغییر کرده یا مسیر تکراری است. داده‌های تازه را بررسی کنید.');
      this.reload();
      return;
    }
    if (err.status === 403) {
      this.cancel();
      this.canManage.set(false);
      this.error.set('مجوز مدیریت منو لغو شده یا آیتم متعلق به Tenant شما نیست.');
      this.reload();
      return;
    }
    this.error.set(err.status === 400
      ? 'عنوان، مسیر، والد یا ترتیب انتخاب‌شده معتبر نیست.'
      : 'عملیات ذخیره منو انجام نشد؛ دوباره تلاش کنید.');
  }
}
