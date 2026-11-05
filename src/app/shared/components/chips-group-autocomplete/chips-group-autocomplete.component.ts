import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  ControlContainer,
  FormControl,
  FormGroupDirective,
  ReactiveFormsModule
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent
} from '@angular/material/autocomplete';
import {
  MatChipInputEvent,
  MatChipsModule
} from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ValidationError } from '../form-components';

export interface GenericOptionRef {
  id: number | string;
  type: string;
}

export interface GenericOption extends GenericOptionRef {
  name: string;
}

export interface GenericOptionGroup {
  key: string;
  label: string;
  items: GenericOption[];
}



@Component({
  selector: 'app-grouped-chips-autocomplete',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatAutocompleteModule
  ],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective }
  ],
  templateUrl: './chips-group-autocomplete.component.html',
  styleUrl:'chips-group-autocomplete.component.scss'
})
export class GroupedChipsAutocompleteComponent implements OnInit,OnChanges {
  @Input({ required: true }) controlName!: string;
  @Input() label = '';
  @Input() placeholder = 'جستجو...';
  @Input() id = '';
  @Input() validationErrors: ValidationError[] = [];

  @Input({ required: true }) options: GenericOption[] = [];
  @Input() allowFreeText = false;
  @Input() readonly = false;
  @Input() searchDebounceMs = 250;
  @Input() separatorKeysCodes: number[] = [ENTER, COMMA];

  @Input() groupLabels: Record<string, string> = {};

  @Output() selectionChanged = new EventEmitter<GenericOption[]>();
  @Output() itemAdded = new EventEmitter<GenericOption>();
  @Output() itemRemoved = new EventEmitter<GenericOption>();
  @Output() searchChanged = new EventEmitter<string>();

  readonly searchCtrl = new FormControl<string>('', { nonNullable: true });

  filteredGroups: GenericOptionGroup[] = [];
  selectedItems: GenericOption[] = [];

  private readonly destroyRef = inject(DestroyRef);
  private readonly announcer = inject(LiveAnnouncer);
private hydrateSelectedItems(value: unknown): GenericOption[] {
  if (!Array.isArray(value)) {
    console.log('[hydrateSelectedItems] value is not array:', value);
    return [];
  }

  console.log('[hydrateSelectedItems] raw form value:', value);
  console.log('[hydrateSelectedItems] current options:', this.options);

  return value
    .map(raw => {
      if (!raw || typeof raw !== 'object') {
        console.log('[hydrateSelectedItems] invalid raw item:', raw);
        return null;
      }

      const selected = raw as Partial<GenericOption>;
      const matchedOption = this.findMatchedOption(selected);

      console.log('[hydrateSelectedItems] selected:', selected);
      console.log('[hydrateSelectedItems] matchedOption:', matchedOption);

      if (matchedOption) {
        return {
          id: matchedOption.id,
          type: matchedOption.type,
          name: matchedOption.name
        };
      }

      return {
        id: selected.id ?? '',
        type: String(selected.type ?? 'default'),
        name: String(selected.name ?? '')
      };
    })
    .filter((item): item is GenericOption => item !== null);
}
ngOnChanges(changes: SimpleChanges): void {
  if (changes['options']) {
    console.log('[ngOnChanges] options changed:', this.options);

    this.selectedItems = this.hydrateSelectedItems(this.control?.value);

    this.refreshFilteredGroups(
      typeof this.searchCtrl.value === 'string'
        ? this.searchCtrl.value
        : ''
    );
  }
}

private mapToOption(value: unknown): GenericOption | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const selected = value as Partial<GenericOption>;
  const selectedId = selected.id;
  const selectedType = String(selected.type ?? 'default').trim().toLowerCase();

  const matchedOption = (this.options ?? []).find(option =>
    String(option.id) === String(selectedId) &&
    String(option.type).trim().toLowerCase() === selectedType
  );

  if (matchedOption) {
    return matchedOption;
  }

  return {
    id: selectedId!,
    type: selected.type ?? 'default',
    name: selected.name ?? ''
  };
}
private normalizeId(value: unknown): string {
  return String(value ?? '').trim();
}

private normalizeType(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}
private findMatchedOption(selected: Partial<GenericOption>): GenericOption | undefined {
  const selectedId = this.normalizeId(selected.id);
  const selectedType = this.normalizeType(selected.type);

  return (this.options ?? []).find(option => {
    const optionId = this.normalizeId(option.id);
    const optionType = this.normalizeType(option.type);

    const idMatches = optionId === selectedId;

    // اگر type در selected نبود، فقط id را ملاک بگیر
    const typeMatches = selectedType
      ? optionType === selectedType
      : true;

    return idMatches && typeMatches;
  });
}
private isSameOption(
  first: Partial<GenericOption>,
  second: Partial<GenericOption>
): boolean {
  return (
    String(first.id) === String(second.id) &&
    String(first.type ?? '').toLowerCase() ===
      String(second.type ?? '').toLowerCase()
  );
}

  constructor(private controlContainer: ControlContainer) {}
private initializeValue(): void {
  this.selectedItems = this.hydrateSelectedItems(this.control?.value);
  this.refreshFilteredGroups('');
}

  get control(): AbstractControl | null {
    // اضافه کردن Safe Navigation برای جلوگیری از خطا در زمان تست یا رندر اولیه
    return this.controlContainer?.control?.get(this.controlName) ?? null;
  }

 ngOnInit(): void {
    // ۱. اطمینان از مقداردهی اولیه حتی اگر کنترل نال باشد
    this.initializeValue();

    // ۲. گوش دادن به تغییرات فیلتر جستجو
    this.searchCtrl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(this.searchDebounceMs),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(term => {
        this.refreshFilteredGroups(term || '');
        this.searchChanged.emit(term || '');
      });

    // ۳. گوش دادن به تغییرات مستقیم از سمت Parent (مانند patchValue)
    // این بخش باعث می‌شود اگر از بیرون لیستی داده شد، خودکار در چیپ‌ها نمایش داده شود
    this.control?.valueChanges
      ?.pipe(
        takeUntilDestroyed(this.destroyRef),
        startWith(this.control.value) // مقدار اولیه را هم در استریم در نظر می‌گیرد
      )
      .subscribe(value => {
  this.selectedItems = this.hydrateSelectedItems(value);

  this.refreshFilteredGroups(
    typeof this.searchCtrl.value === 'string'
      ? this.searchCtrl.value
      : ''
  );
});
  }

  private updateControlValue(items: GenericOption[]): void {
    this.selectedItems = items;
    // استفاده از emitEvent: false اگر نمی‌خواهید valueChanges دوباره تحریک شود
    // اما در اینجا برای همگام‌سازی، معمولا اجازه می‌دهیم emit شود
    this.control?.setValue(items);
    this.control?.markAsDirty();
    this.control?.markAsTouched();
    
    this.selectionChanged.emit(items);
    this.refreshFilteredGroups(this.searchCtrl.value ?? '');
  }
 

  selected(event: MatAutocompleteSelectedEvent): void {
    const item = event.option.value as GenericOption;
    this.addItem(item);
    this.searchCtrl.setValue('', { emitEvent: true });
    event.option.deselect();
  }

  remove(item: GenericOption): void {
    if (this.readonly) return;

    const updated = this.selectedItems.filter(
      selected => this.getOptionKey(selected) !== this.getOptionKey(item)
    );

    this.updateControlValue(updated);
    this.itemRemoved.emit(item);
    this.announcer.announce(`Removed ${item.name}`);
  }

  addFromText(event: MatChipInputEvent): void {
    if (this.readonly) return;

    const value = (event.value || '').trim();

    if (!value) {
      this.searchCtrl.setValue('', { emitEvent: false });
      event.chipInput?.clear();
      return;
    }

    const matchedItem = this.findExactOption(value);

    if (matchedItem) {
      this.addItem(matchedItem);
    } else if (this.allowFreeText) {
      this.addItem({
        id: value,
        name: value,
        type: 'default'
      });
    }

    this.searchCtrl.setValue('', { emitEvent: false });
    event.chipInput?.clear();
    this.refreshFilteredGroups('');
  }

  trackOption(item: GenericOption): string {
    return this.getOptionKey(item);
  }

  getErrorMessage(): string | null {
    const control = this.control;
    if (!control || !control.touched) return null;

    const matchedError = this.validationErrors.find(
      error => control.hasError(error.type)
    );

    return matchedError ? matchedError.message : null;
  }

  resolveGroupLabel(type: string): string {
    return this.groupLabels[type] || type;
  }

  private addItem(item: GenericOption): void {
    const exists = this.selectedItems.some(
      selected => this.getOptionKey(selected) === this.getOptionKey(item)
    );

    if (exists) return;

    const updated = [...this.selectedItems, item];
    this.updateControlValue(updated);
    this.itemAdded.emit(item);
  }

  

private refreshFilteredGroups(searchTerm: unknown): void {
  const normalized =
    typeof searchTerm === 'string'
      ? searchTerm.trim().toLowerCase()
      : String(searchTerm ?? '').trim().toLowerCase();

  const selectedKeys = new Set(
    (this.selectedItems ?? []).map(item => this.getOptionKey(item))
  );

  const filtered = (this.options ?? []).filter(item => {
    const alreadySelected = selectedKeys.has(this.getOptionKey(item));

    const matches =
      !normalized ||
      item.name.toLowerCase().includes(normalized) ||
      String(item.id).toLowerCase().includes(normalized) ||
      item.type.toLowerCase().includes(normalized);

    return !alreadySelected && matches;
  });

  const groupedMap = new Map<string, GenericOption[]>();

  for (const item of filtered) {
    if (!groupedMap.has(item.type)) {
      groupedMap.set(item.type, []);
    }

    groupedMap.get(item.type)!.push(item);
  }

  this.filteredGroups = Array.from(groupedMap.entries()).map(([key, items]) => ({
    key,
    label: this.resolveGroupLabel(key),
    items
  }));
}

  private findExactOption(value: string): GenericOption | null {
    const normalized = value.toLowerCase();

    return this.options.find(item =>
      item.name.toLowerCase() === normalized ||
      String(item.id).toLowerCase() === normalized
    ) ?? null;
  }

  private getOptionKey(item: GenericOption): string {
    return `${item.type}:${item.id}`;
  }
}
