import { Component, DestroyRef, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { GridComponent } from '../grid/grid.component';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

@Component({
  selector: 'app-select-filter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    NgxMatSelectSearchModule
  ],
  template: `
    <mat-form-field appearance="outline" class="filter-field">
      <mat-label>{{ label }}</mat-label>

      <mat-select
        [value]="selectedValue"
        (selectionChange)="onSelectionChange($event.value)"
        (openedChange)="onPanelToggle($event)">

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
        }
      </mat-select>
    </mat-form-field>
  `,
})
export class SelectFilterComponent implements OnInit {
    @Input() grid!:GridComponent
    @Input() field!:string
  
  @Input() label: string = '';
  @Input({ required: true }) options: any[] = [];
  @Input() idField: string = 'id';
  @Input() valueField: string = 'name';

  @Input() selectedValue: any = null;

  @Input() showNeutralOption: boolean = false;
  @Input() neutralOptionLabel: string = 'همه';
  @Input() neutralOptionValue: any = null;

  // search config
  @Input() searchable: boolean = false;
  @Input() searchPlaceholder: string = 'جستجو...';
  @Input() noResultText: string = 'موردی یافت نشد';
  @Input() searchDebounceMs: number = 400;
  @Input() clearSearchOnClose: boolean = true;

  @Output() selectionChanged = new EventEmitter<any>();
  @Output() searchChanged = new EventEmitter<string>();

  readonly searchCtrl = new FormControl('');

  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    if (this.searchable) {
      this.searchCtrl.valueChanges
        .pipe(
          debounceTime(this.searchDebounceMs),
          distinctUntilChanged(),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(term => {
          this.searchChanged.emit(term ?? '');
        });
    }
  }

  onSelectionChange(value: any): void {
    
    this.selectedValue = value;
    this.grid.setColumnFilter(this.field,value,'Equals')
    this.selectionChanged.emit(value);
  }

  onPanelToggle(opened: boolean): void {
    if (!opened && this.clearSearchOnClose && this.searchCtrl.value) {
      this.searchCtrl.setValue('', { emitEvent: false });
      this.searchChanged.emit('');
    }
  }
}
