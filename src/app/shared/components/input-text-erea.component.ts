import { Component, Input } from '@angular/core';
import {
  AbstractControl,
  ControlContainer,
  FormGroupDirective,
  ReactiveFormsModule
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ValidationError } from './input-string.component';


@Component({
  selector: 'app-custom-text-erea',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  // ⭐ کلیدی‌ترین بخش: اتصال کامپوننت فرزند به FormGroup والد
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective }
  ],
  template: `<div class="form-group">
    @if (label) {
        <label class="main-label d-block fw-medium text-black" [for]="id">
            {{ label }}
        </label>
    }
    <mat-form-field>
        @if (placeholder) {
            <mat-label>{{ placeholder }}</mat-label>
        }
        <textarea matInput [rows]="rows"
               [type]="inputType"
               [id]="id"
               [formControlName]="controlName"></textarea>
        @if(icon){
            <mat-icon matSuffix>{{icon}}</mat-icon>

        }
        @if (isPassword) {
            <button mat-icon-button
                    matSuffix
                    type="button"
                    (click)="hide = !hide"
                    [attr.aria-label]="'Hide password'"
                    [attr.aria-pressed]="hide">
                <span class="material-symbols-outlined">
                    {{ hide ? 'visibility_off' : 'visibility' }}
                </span>
            </button>
        }
    </mat-form-field>

    @if (getErrorMessage()) {
        <div class="error text-danger">
            {{ getErrorMessage() }}
        </div>
    }
</div>`,
})
export class CustomTextEreaComponent {
  @Input({ required: true }) controlName!: string;
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() type: 'text' | 'password' | 'email' | 'number' = 'text';
  @Input() id: string = '';
  @Input() rows: number = 3;
  @Input() validationErrors: ValidationError[] = [];
@Input() icon!:string;
  hide: boolean = true;

  constructor(private controlContainer: ControlContainer) {}

  // دسترسی به کنترل از طریق FormGroup والد
  get control(): AbstractControl | null {
    return this.controlContainer.control?.get(this.controlName) ?? null;
  }

  get isPassword(): boolean {
    return this.type === 'password';
  }

  get inputType(): string {
    if (this.isPassword) {
      return this.hide ? 'password' : 'text';
    }
    return this.type;
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
