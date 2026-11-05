import { AfterViewInit, Component, inject, Input, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute } from '@angular/router';


import { ResourcesService } from '../resources.service';
import { Location } from '@angular/common';
import {
  PageHeaderComponent,
NoAutofillDirective,
CustomInputComponent,
CustomSelectComponent,
CustomTextEreaComponent,
CustomToggleComponent,

}from '../../../../shared/components/form-components'
import { CustomizerSettingsService } from '../../../../shared/services/customizer-settings.service';
import { ModulesService } from '../../modules/modules.service';
@Component({
  selector: 'app-resource-form.component',
    imports: [NoAutofillDirective, ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatCheckboxModule, CustomInputComponent, CustomToggleComponent, CustomInputComponent, CustomTextEreaComponent, CustomSelectComponent, PageHeaderComponent],
  templateUrl: './resource-form.component.html',
  styleUrl: './resource-form.component.scss',
})
export class ResourceFormComponent implements AfterViewInit {
  @Input() resourceId?:string;
  modules=signal<any|null>([])
  ngAfterViewInit(): void {
    this.searchModule()
  }
  searchModule(text?:string){
this.moduleService.getLookup().subscribe({
      next:x=>{this.modules.set(x)}
    })
  }
themeService:CustomizerSettingsService=inject(CustomizerSettingsService)
_loc:Location=inject(Location)
service:ResourcesService=inject(ResourcesService)
moduleService:ModulesService=inject(ModulesService)
route: ActivatedRoute = inject(ActivatedRoute);
update:boolean=false;
back(){
  
             this._loc.back()
  }
ngOnInit() {
  

  if (this.resourceId) {
    this.update=true
    this.load();
  }
}
 
load(){
  this.service.getById(this.resourceId!).subscribe({
     next: (item:any) => {
      
      this.userForm.patchValue({
        moduleId:item.moduleId,
        title: item.title,
        code: item.code,
        isActive: item.isActive,
        description:item.description,
        sortOrder:item.sortOrder,
      });
    },
  })
}
userForm = new FormGroup({
  moduleId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
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
    sortOrder: new FormControl('', {
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
      this.service.update(this.resourceId!,this.userForm).subscribe({
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
