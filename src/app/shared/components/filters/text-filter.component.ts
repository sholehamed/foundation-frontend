import { Component, Input } from '@angular/core';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from '@angular/material/input';
import { GridComponent } from '../grid/grid.component';

@Component({
  selector: 'app-text-filter',
  imports: [MatFormFieldModule,MatInputModule],
  template: ` <mat-form-field appearance="outline" class="filter-field">
      <mat-label>{{label}}</mat-label>
      <input #filterInput matInput (keyup)="grid.setColumnFilter(field,filterInput.value,'Contains')" [placeholder]="placeHolder!">
    </mat-form-field>`,
})
export class TextFilterComponent {
  @Input() grid!:GridComponent
  @Input() label!:string
  @Input() field!:string
  @Input() placeHolder?:string=''
}
