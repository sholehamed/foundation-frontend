import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

export interface ConfirmDialogData {
  title?: string;
  message: string;
  cancelLabel?: string;
  acceptLabel?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule],
  template: `
    <h1 mat-dialog-title>
      {{ data.title || 'هشدار' }}
    </h1>

    <div mat-dialog-content>
      <p>{{ data.message }}</p>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button (click)="close(false)">
        {{ data.cancelLabel || 'لغو' }}
      </button>

      <button mat-flat-button color="primary" (click)="close(true)" cdkFocusInitial>
        {{ data.acceptLabel || 'تأیید' }}
      </button>
    </div>
  `
})
export class ConfirmDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  close(result: boolean): void {
    this.dialogRef.close(result);
  }
}
