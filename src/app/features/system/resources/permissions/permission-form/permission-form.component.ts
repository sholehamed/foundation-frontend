import { AfterViewInit, Component, inject, Input, signal, OnInit } from '@angular/core';
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
import {Location} from '@angular/common'
import {
  PageHeaderComponent,NoAutofillDirective,
  CustomInputComponent,
  CustomSelectComponent,
  CustomTextEreaComponent,
  CustomToggleComponent,
  GroupedChipsAutocompleteComponent

}from '../../../../../shared/components/form-components'
import { ResourcesService } from '../../resources.service';
import { PermissionsService } from '../permissions.service';
import { CustomizerSettingsService } from '../../../../../shared/services/customizer-settings.service';
@Component({
  selector: 'app-permission-form',
    imports: [NoAutofillDirective, ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatCheckboxModule, CustomInputComponent, CustomToggleComponent, CustomInputComponent, CustomTextEreaComponent, CustomSelectComponent, PageHeaderComponent, GroupedChipsAutocompleteComponent],
  templateUrl: './permission-form.component.html',
  styleUrl: './permission-form.component.scss',
})
export class PermissionFormComponent implements AfterViewInit, OnInit {
  @Input() permissionId?:string;
  @Input() resourceId?:string;

  ngAfterViewInit(): void {
    this.searchResource()
  }
  resources=signal<any[]|null>([])
  searchResource(text?:string){
this.resourceService.getLookup().subscribe({
      next:x=>{this.resources.set(x)}
    })
  }
   apiUiResource=signal<any[]|null>([])
  searchApiUiResource(resourceId?: string) {
    const id = resourceId ?? this.userForm.controls.resourceId.value;
    if (!id) { this.apiUiResource.set([]); return; }
    this.resourceService.getgroupedLookup(id).subscribe({
      next: options => this.apiUiResource.set(options),
      error: () => this.apiUiResource.set([])
    });
  }
themeService:CustomizerSettingsService=inject(CustomizerSettingsService)
_loc:Location=inject(Location)
service:PermissionsService=inject(PermissionsService)
resourceService:ResourcesService=inject(ResourcesService)
route: ActivatedRoute = inject(ActivatedRoute);
update:boolean=false;
back(){
  
             this._loc.back()
  }
ngOnInit() {
   this.userForm.controls.resourceId.valueChanges.subscribe(id => {
     this.userForm.controls.permissionResources.setValue([]);
     this.searchApiUiResource(id);
   });
   if (this.resourceId) {
    this.userForm.patchValue({
      resourceId: this.resourceId
    });
  }

  if (this.permissionId) {
    this.update=true
    this.load();
  }
}
 
load(){
  this.service.getById(this.permissionId!).subscribe({
     next: (item:any) => {
      
      this.userForm.patchValue(item);
      this.searchApiUiResource(item.resourceId);
    },
  })
}
userForm = new FormGroup({
  resourceId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    permissionResources: new FormControl<{ id: string; type: string }[]>([], {
      nonNullable: true,
      validators: [],
    }),
    name: new FormControl('', {
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
   
  },
);
 
  Submit(){
    if (this.userForm.invalid) { this.userForm.markAllAsTouched(); return; }
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
      this.service.update(this.permissionId!,this.userForm).subscribe({
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




