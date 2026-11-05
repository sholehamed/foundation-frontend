import { Component, inject, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import{Location} from '@angular/common'
import { TenantsService } from '../tenants.service';
import
 { 
  CustomInputComponent,
   CustomToggleComponent,
   PageHeaderComponent,
   AvatarUploadComponent ,
   BaseFormComponent,
   NoAutofillDirective
  } from '../../../../shared/components/form-components';
import { CustomizerSettingsService } from '../../../../shared/services/customizer-settings.service';


@Component({
  selector: 'app-tenant-form.component',
    imports: [NoAutofillDirective, ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatCheckboxModule, AvatarUploadComponent, CustomInputComponent, CustomToggleComponent, PageHeaderComponent],
  templateUrl: './tenant-form.component.html',
  styleUrl: './tenant-form.component.scss',
})
export class TenantFormComponent extends BaseFormComponent implements OnInit {
  override backUrl?: any[]=['/system/tenants'];
  @Input() tenantId?:string
themeService:CustomizerSettingsService=inject(CustomizerSettingsService)
_loc:Location=inject(Location)
service:TenantsService=inject(TenantsService)
update:boolean=false;

ngOnInit() {
 

  if (this.tenantId) {
    this.update=true
    this.load();
  }
}
 
load(){
  this.service.getById(this.tenantId).subscribe({
     next: (item:any) => {
      
      this.form.patchValue({
        domain:item.domain,
        favicon:item.favicon,
        logo:item.logo,
        name: item.name,
        slug: item.slug,
        isActive: item.isActive,
      });
    },
  })
}
  override form: FormGroup<any> = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    slug: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
     domain: new FormControl('', {
      nonNullable: true,
      validators: [],
    }),
     favicon: new FormControl('', {
      nonNullable: true,
      validators: [],
    }),
     logo: new FormControl('', {
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
 
  Submit(){
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
      this.service.update(this.tenantId,this.form).subscribe({
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


