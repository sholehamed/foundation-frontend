import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import {
  AbstractControl,
  ControlContainer,
  FormGroupDirective,
  ReactiveFormsModule
} from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { CommonModule } from '@angular/common';
import { ValidationError } from './input-string.component';

@Component({
  selector: 'app-custom-radio',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatRadioModule
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

      <mat-radio-group
        [id]="id"
        [formControlName]="controlName"
        [color]="color"
        [ngClass]="{ 'radio-vertical': direction === 'vertical' }"
        (change)="onSelectionChange($event.value)">

        @if (showNeutralOption) {
          <mat-radio-button [value]="neutralOptionValue">
            {{ neutralOptionLabel }}
          </mat-radio-button>
        }

        @for (option of options; track option[idField]) {
          <mat-radio-button [value]="option[idField]">
            {{ option[valueField] }}
          </mat-radio-button>
        }
      </mat-radio-group>

      @if (getErrorMessage()) {
        <div class="error text-danger">
          {{ getErrorMessage() }}
        </div>
      }
    </div>
  `,
  styles: [`
    .form-group {
      margin-bottom: 1rem;
    }
    .main-label {
      margin-bottom: 0.5rem;
    }
    mat-radio-group {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem 1rem;
    }
    .radio-vertical {
      flex-direction: column;
    }
    .error {
      margin-top: 0.25rem;
      font-size: 0.85rem;
    }
  `]
})
export class CustomRadioComponent implements OnInit {
  @Input({ required: true }) controlName!: string;
  @Input() label: string = '';
  @Input() id: string = '';
  @Input() validationErrors: ValidationError[] = [];
  @Input({ required: true }) options: any[] = [];
  @Input() idField: string = 'id';
  @Input() valueField: string = 'name';

  // رنگ و جهت چیدمان
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() direction: 'horizontal' | 'vertical' = 'horizontal';

  // انتخاب خودکار اولین مورد
  @Input() autoSelectFirst: boolean = false;

  // نمایش گزینه خنثی
  @Input() showNeutralOption: boolean = false;
  @Input() neutralOptionLabel: string = 'همه';
  @Input() neutralOptionValue: any = null;

  // رویداد تغییر
  @Output() selectionChanged = new EventEmitter<any>();

  constructor(private controlContainer: ControlContainer) {}

  ngOnInit(): void {
    if (this.autoSelectFirst && this.options.length > 0) {
      const firstValue = this.options[0][this.idField];
      this.control?.setValue(firstValue);
      this.selectionChanged.emit(firstValue);
    }
  }

  get control(): AbstractControl | null {
    return this.controlContainer.control?.get(this.controlName) ?? null;
  }

  onSelectionChange(value: any): void {
    this.selectionChanged.emit(value);
  }

  getErrorMessage(): string | null {
    const control = this.control;

    if (!control || !control.touched) {
      return null;
    }

    const matchedError = this.validationErrors.find(
      error => control.hasError(error.type)
    );

    return matchedError ? matchedError.message : null;
  }
}
