import {
  Component, Input, Output, EventEmitter, OnInit, DestroyRef, inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import {
  AbstractControl,
  ControlContainer,
  FormControl,
  FormGroupDirective,
  ReactiveFormsModule
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { ValidationError } from './input-string.component';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [
    NgxMatSelectSearchModule,
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule
  ],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective }
  ],
  template: `
    <div class="form-group">
      @if (label) {
        <label class="main-label d-block fw-medium text-black" [for]="id">
          {{ label }}
        </label>
      }

      <mat-form-field>
        @if (placeholder) {
          <mat-label>{{ placeholder }}</mat-label>
        }
        <mat-select
          [id]="id"
          [formControlName]="controlName"
          (selectionChange)="onSelectionChange($event.value)"
          (openedChange)="onPanelToggle($event)">

          <!-- کامپوننت جستجوی ngx — داخل mat-option قرار می‌گیرد -->
          @if (searchable) {
            <mat-option>
              <ngx-mat-select-search
                [formControl]="searchCtrl"
                [placeholderLabel]="searchPlaceholder"
                [noEntriesFoundLabel]="noResultText">
              </ngx-mat-select-search>
            </mat-option>
          }

          @if (showNeutralOption) {
            <mat-option [value]="neutralOptionValue">
              {{ neutralOptionLabel }}
            </mat-option>
          }

          @for (option of options; track option[idField]) {
            <mat-option [value]="option[idField]">
              {{ option[valueField] }}
            </mat-option>
          }</mat-select>
      </mat-form-field>

      @if (getErrorMessage()) {
        <div class="error text-danger">
          {{ getErrorMessage() }}
        </div>
      }
    </div>
  `,
  styles: [`
    /* ngx-mat-select-search استایل خودش رو داره، تنظیم اضافی در صورت نیاز */
    ::ng-deep .mat-select-search-inner {
      border-bottom: 1px solid #e0e0e0;
    }`]
})
export class CustomSelectComponent implements OnInit {
  @Input({ required: true }) controlName!: string;
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() id: string = '';
  @Input() validationErrors: ValidationError[] = [];
  @Input({ required: true }) options: any[] = [];
  @Input() idField: string = 'id';
  @Input() valueField: string = 'name';

  @Input() autoSelectFirst: boolean = false;

  @Input() showNeutralOption: boolean = false;
  @Input() neutralOptionLabel: string = 'همه';
  @Input() neutralOptionValue: any = null;

  // ---- تنظیمات جستجو ----
  @Input() searchable: boolean = false;
  @Input() searchPlaceholder: string = 'جستجو...';
  @Input() noResultText: string = 'موردی یافت نشد';
  @Input() searchDebounceMs: number = 400;
  @Input() clearSearchOnClose: boolean = true;

  @Output() selectionChanged = new EventEmitter<any>();
  @Output() searchChanged = new EventEmitter<string>();

  // FormControl اختصاصی برای ngx-mat-select-search (مجزا از فرم اصلی)
  readonly searchCtrl = new FormControl('');

  // برای استفاده از takeUntilDestroyed خارج از constructor
  private readonly destroyRef = inject(DestroyRef);

  constructor(private controlContainer: ControlContainer) {}

  ngOnInit(): void {
    // autoSelectFirst
    if (this.autoSelectFirst && this.options.length > 0) {
      const firstValue = this.options[0][this.idField];
      this.control?.setValue(firstValue);
      this.selectionChanged.emit(firstValue);
    }

    // subscription جستجو — اینجا @Input ها مقدار واقعی دارند
    if (this.searchable) {
      this.searchCtrl.valueChanges.pipe(
        debounceTime(this.searchDebounceMs),   // از مقدار واقعی والد استفاده می‌شه
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)    // پاکسازی خودکار
      ).subscribe(term => {
        this.searchChanged.emit(term ?? '');
      });
    }
  }

  get control(): AbstractControl | null {
    return this.controlContainer.control?.get(this.controlName) ?? null;
  }

  onSelectionChange(value: any): void {
    this.selectionChanged.emit(value);
  }

  onPanelToggle(opened: boolean): void {
    // بستن پنل → پاک کردن جستجو
    if (!opened && this.clearSearchOnClose && this.searchCtrl.value) {
      // emitEvent: false → جلوگیری از trigger شدن مجدد valueChanges
      this.searchCtrl.setValue('', { emitEvent: false });
      this.searchChanged.emit('');
    }
  }

  getErrorMessage(): string | null {
    const control = this.control;
    if (!control || !control.touched) return null;

    const matchedError = this.validationErrors.find(
      error => control.hasError(error.type)
    );
    return matchedError ? matchedError.message : null;
  }
}
