import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MenuApiService } from '../menu-management.service';
import { MenuCategoryDto } from '../menu-management.model';


@Component({
  selector: 'app-menu-category-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید' }}</h2>
    <mat-dialog-content [formGroup]="form">
      <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 8px;">
        <mat-form-field appearance="outline">
          <mat-label>عنوان دسته‌بندی</mat-label>
          <input matInput formControlName="title" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>ترتیب نمایش</mat-label>
          <input matInput type="number" formControlName="order" />
        </mat-form-field>

        <mat-slide-toggle formControlName="isActive">فعال</mat-slide-toggle>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">انصراف</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">ذخیره</button>
    </mat-dialog-actions>
  `
})
export class MenuCategoryDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(MenuApiService);
  private readonly dialogRef = inject(MatDialogRef<MenuCategoryDialogComponent>);
  readonly data = inject<MenuCategoryDto | null>(MAT_DIALOG_DATA, { optional: true });
  form = this.fb.group({
    title: [this.data?.title ?? '', [Validators.required, Validators.maxLength(150)]],
    order: [this.data?.order ?? 1, [Validators.required, Validators.min(1)]],
    isActive: [this.data?.isActive ?? true]
  });


  save() {
    if (this.form.invalid) return;

    const val = this.form.value;
    const payload = {
      title: val.title!,
      order: Number(val.order),
      isActive: !!val.isActive
    };

    if (this.data) {
      this.api.updateCategory(this.data.id, payload).subscribe(() => this.dialogRef.close(true));
    } else {
      this.api.createCategory(payload).subscribe(() => this.dialogRef.close(true));
    }
  }

  cancel() {
    this.dialogRef.close(false);
  }
}
