import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
  AbstractControl,
  ControlContainer,
  FormGroupDirective,
  ReactiveFormsModule
} from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ValidationError } from './input-string.component';

@Component({
  selector: 'app-custom-checkbox',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCheckboxModule
  ],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective }
  ],
  template: `<div class="form-group">
    <mat-checkbox
        [id]="id"
        [formControlName]="controlName"
        [color]="color"
        [labelPosition]="labelPosition"
        [indeterminate]="indeterminate"
        (change)="onCheckboxChange($event.checked)">
        {{ label }}
    </mat-checkbox>

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
    .error {
      margin-top: 0.25rem;
      font-size: 0.85rem;
    }
  `]
})
export class CustomCheckboxComponent {
  @Input({ required: true }) controlName!: string;
  @Input() label: string = '';
  @Input() id: string = '';
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() labelPosition: 'before' | 'after' = 'after';
  @Input() indeterminate: boolean = false;
  @Input() validationErrors: ValidationError[] = [];

  @Output() checkboxChanged = new EventEmitter<boolean>();

  constructor(private controlContainer: ControlContainer) {}

  get control(): AbstractControl | null {
    return this.controlContainer.control?.get(this.controlName) ?? null;
  }

  onCheckboxChange(checked: boolean): void {
    this.checkboxChanged.emit(checked);
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
