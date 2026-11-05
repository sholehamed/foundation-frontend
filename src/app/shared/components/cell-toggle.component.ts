import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
  ControlContainer,
  FormGroupDirective,
  ReactiveFormsModule
} from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-cell-toggle',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatSlideToggleModule
  ],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective }
  ],
  template: `<div class="form-group">
    <mat-slide-toggle #check
        [id]="id"
        [color]="color"
        [checked]="value"
        [labelPosition]="labelPosition"
        (change)="onToggleChange($event.checked)">
        @if(check.checked){
          {{ trueLabel }}
        }
        @else  {
          {{ falseLabel }}
        }
    </mat-slide-toggle>

   
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
export class CellToggleComponent {
  @Input() value:boolean=false
  @Input() trueLabel: string = '';
  @Input() falseLabel: string = '';
  @Input() id: string = '';
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() labelPosition: 'before' | 'after' = 'after';

  @Output() toggleChanged = new EventEmitter<boolean>();




  onToggleChange(checked: boolean): void {
    this.toggleChanged.emit(checked);
  }

  
}
