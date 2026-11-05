import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
  AbstractControl,
  ControlContainer,
  FormGroupDirective,
  ReactiveFormsModule
} from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ValidationError } from './input-string.component';

@Component({
  selector: 'app-custom-toggle',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatSlideToggleModule
  ],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective }
  ],
  template: `<div class="form-group">
    <mat-slide-toggle
        [id]="id"
        [formControlName]="controlName"
        [color]="color"
        [labelPosition]="labelPosition"
        (change)="onToggleChange($event.checked)">
        {{ label }}
    </mat-slide-toggle>

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
export class CustomToggleComponent {
  @Input({ required: true }) controlName!: string;
  @Input() label: string = '';
  @Input() id: string = '';
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() labelPosition: 'before' | 'after' = 'after';
  @Input() validationErrors: ValidationError[] = [];

  @Output() toggleChanged = new EventEmitter<boolean>();

  constructor(private controlContainer: ControlContainer) {}

  get control(): AbstractControl | null {
    return this.controlContainer.control?.get(this.controlName) ?? null;
  }

  onToggleChange(checked: boolean): void {
    this.toggleChanged.emit(checked);
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
