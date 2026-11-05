import { Component, inject, Input } from '@angular/core';
import { BreadcrumbComponent } from "../../../../shared/components/breadcrumb/breadcrumb.component";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CustomInputComponent, CustomTextEreaComponent, CustomToggleComponent, NoAutofillDirective } from '../../../../shared/components/form-components';
import { ActivatedRoute } from '@angular/router';
import { ModulesService } from '../modules.service';
import{Location} from '@angular/common'
import { CustomizerSettingsService } from '../../../../shared/services/customizer-settings.service';

@Component({
  selector: 'app-module-form',
    imports: [NoAutofillDirective, ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatCheckboxModule, BreadcrumbComponent, CustomInputComponent, CustomToggleComponent, CustomInputComponent, CustomTextEreaComponent],
  templateUrl: './module-form.component.html',
  styleUrl: './module-form.component.scss',
})
export class ModuleFormComponent {
  @Input() moduleId?:string;
themeService:CustomizerSettingsService=inject(CustomizerSettingsService)
_loc:Location=inject(Location)
service:ModulesService=inject(ModulesService)
route: ActivatedRoute = inject(ActivatedRoute);
update:boolean=false;
back(){
  
             this._loc.back()
  }
ngOnInit() {
  

  if (this.moduleId) {
    this.update=true
    this.load();
  }
}
 
load(){
  this.service.getById(this.moduleId!).subscribe({
     next: (item:any) => {
      
      this.userForm.patchValue({
        title: item.title,
        code: item.code,
        isActive: item.isActive,
        sortOrder:item.sortOrder,
        description:item.description
      });
    },
  })
}
userForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl('', {
      nonNullable: false,
      validators: [],
    }),
    isActive: new FormControl(true, {
      nonNullable: true,
      validators: [Validators.required],
    },),
    sortOrder: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required],
    },),
  },
);
 
  Submit(){
    if(!this.update){
      this.service.create(this.userForm).subscribe({
        next:value=>{
          this.back()
        },
        error(err) {
          alert(err)
        },
      })
    }
    else{
      this.service.update(this.moduleId!,this.userForm).subscribe({
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



