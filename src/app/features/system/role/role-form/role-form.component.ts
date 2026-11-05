import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { finalize } from 'rxjs';
import { BaseFormComponent } from '../../../../shared/components/base-form.component';
import { RolesService } from '../roles.service';

interface RoleDetails {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSlideToggleModule, MatButtonModule],
  templateUrl: './role-form.component.html',
  styleUrl: './role-form.component.scss',
})
export class RoleFormComponent extends BaseFormComponent implements OnInit {
  @Input() roleId?: string;
  override backUrl = ['/system/roles'];
  private readonly service = inject(RolesService);
  private readonly nav = inject(Router);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  override form = new FormGroup({
    name: new FormControl('', { nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)] }),
    description: new FormControl<string | null>(null),
    isActive: new FormControl(true, { nonNullable: true }),
  });

  constructor(dialog: MatDialog) { super(dialog); }

  ngOnInit() {
    if (!this.roleId) return;
    this.loading.set(true);
    this.service.getById(this.roleId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: res => {
          const role = res as RoleDetails;
          this.form.patchValue({
            name: role.name, description: role.description, isActive: role.isActive,
          });
          this.form.markAsPristine();
        },
        error: () => this.error.set('دریافت اطلاعات نقش ناموفق بود.'),
      });
  }

  save(): void {
    if (this.form.invalid || this.isSaving) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving = true;
    this.error.set(null);
    const roleId = this.roleId;
    const action = roleId
      ? this.service.update(roleId, this.form)
      : this.service.create(this.form);
    action.pipe(finalize(() => this.isSaving = false)).subscribe({
      next: () => {
        this.form.markAsPristine();
        void this.nav.navigateByUrl('/system/roles');
      },
      error: () => this.error.set('ثبت نقش انجام نشد. مجوز و اطلاعات ورودی را بررسی کنید.'),
    });
  }
}
