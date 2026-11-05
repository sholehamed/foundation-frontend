import { Component, inject, Input, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { BaseFormComponent } from '../../../../shared/components/base-form.component';
import { UsersService } from '../users.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AvatarUploadComponent } from '../../../../shared/components/form-components';
import { PageHeaderComponent } from '../../../../shared/components/grid-components';
import { CustomInputComponent, RemoteValidatorFn } from '../../../../shared/components/input-string.component';
import { CustomToggleComponent } from '../../../../shared/components/input-toggle.component';
import { NoAutofillDirective } from '../../../../shared/directives/noAutoFill';
import { map } from 'rxjs';
import { CustomizerSettingsService } from '../../../../shared/services/customizer-settings.service';

@Component({
  selector: 'app-user-form.component',
    imports: [NoAutofillDirective, ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatCheckboxModule, AvatarUploadComponent, CustomInputComponent, CustomToggleComponent, PageHeaderComponent],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
})
export class UserFormComponent extends BaseFormComponent implements OnInit {
  override backUrl?: any[]=['/system/users'];
  @Input() userId?:string
themeService:CustomizerSettingsService=inject(CustomizerSettingsService)
service:UsersService=inject(UsersService)
update:boolean=false;
 // ⚠️ باید arrow property باشد تا this حفظ شود
  checkUsername: RemoteValidatorFn = (value: string) =>
  this.service.isUsernameTaken(value,this.userId).pipe(
    map(taken => (taken ? { usernameTaken: true } : null))
  );

ngOnInit() {
//   this.form.disable();
// ['email', 'lastName'].forEach(name =>
//   this.form.get(name)?.enable()
// );


  if (this.userId) {
    this.update=true
    this.load();
  }
}
 
load(){
  this.service.getById(this.userId).subscribe({
     next: (item:any) => {
      
      this.form.patchValue(item);
    },
  })
}
  override form: FormGroup<any> = new FormGroup({
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    userName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
     password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
     avatar: new FormControl('', {
      nonNullable: true,
      validators: [],
    }),
    isActive: new FormControl(true, {
      nonNullable: true,
      validators: [Validators.required],
    },
  ),
  },
);
 debugForm(group: FormGroup = this.form, path = ''): void {
  if (group.errors) {
    console.log(`[GROUP ${path || 'root'}]`, group.errors);
  }

  Object.entries(group.controls).forEach(([name, control]) => {
    const full = path ? `${path}.${name}` : name;

    if (control instanceof FormGroup) {
      this.debugForm(control, full);
      return;
    }

    if (control.invalid || control.pending) {
      console.log(full, {
        status: control.status,
        errors: control.errors,
        touched: control.touched,
        disabled: control.disabled
      });
    }
  });
}

  Submit(){
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }


    if(!this.update){
      this.service.create(this.form).subscribe({
        next:value=>{
          this.back()
        },
        error(err) {
          alert(err)
        },
      })
    }
    else{
      this.service.update(this.userId,this.form).subscribe({
        next:value=>{
          this.back()
        },
        error(err) {
          alert(err)
        },
      })
    }
  }
}
