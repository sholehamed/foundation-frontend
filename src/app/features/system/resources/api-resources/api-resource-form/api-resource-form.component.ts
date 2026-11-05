import { AfterViewInit, Component, inject, Input, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ActivatedRoute } from '@angular/router';
import { ResourcesService } from '../../resources.service';
import { Location } from '@angular/common';
import { ApiResourcesService } from '../api-resources.service';
import { CustomInputComponent, CustomSelectComponent, CustomTextEreaComponent, CustomToggleComponent, PageHeaderComponent } from '../../../../../shared/components/form-components';
import { CustomizerSettingsService } from '../../../../../shared/services/customizer-settings.service';

@Component({
  selector: 'app-api-resource-form',
    imports: [ ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, CustomToggleComponent, CustomInputComponent, CustomTextEreaComponent, CustomSelectComponent, PageHeaderComponent],
  templateUrl: './api-resource-form.component.html',
  styleUrl: './api-resource-form.component.scss',
})
export class ApiResourceFormComponent implements AfterViewInit {
  @Input() resourceId?:string;

  @Input()apiResourceId?:string;
  resources=signal<any|null>([])
  httpMethods:{id:number,name:string}[]=[{id:0,name:'POST'},{id:1,name:'PUT'},{id:2,name:'PATCH'},{id:3,name:'DELETE'},{id:4,name:'GET'}]
  sources:{id:number,name:string}[]=[{id:0,name:'Auto'},{id:1,name:'Manual'}]
  ngAfterViewInit(): void {
    this.searchModule()
  }
  searchModule(text?:string){
this.moduleService.getLookup().subscribe({
      next:x=>{this.resources.set(x)}
    })
  }
themeService:CustomizerSettingsService=inject(CustomizerSettingsService)
_loc:Location=inject(Location)
service:ApiResourcesService=inject(ApiResourcesService)
moduleService:ResourcesService=inject(ResourcesService)
route: ActivatedRoute = inject(ActivatedRoute);
update:boolean=false;
back(){
  
             this._loc.back()
  }
ngOnInit() {
    if (this.resourceId) {
    this.userForm.patchValue({
      resourceId: this.resourceId
    });
  }

  if (this.apiResourceId) {
    this.update=true
    this.load();
  }
}
 
load(){
  this.service.getById(this.apiResourceId!).subscribe({
     next: (item:any) => {
      
      this.userForm.patchValue(item);
    },
  })
}
userForm = new FormGroup({
  resourceId: new FormControl(this.resourceId, {nonNullable: true,validators: [Validators.required],}),
  key: new FormControl('', {nonNullable: true,validators: [Validators.required],}),
    title: new FormControl('', {nonNullable: true,validators: [Validators.required],}),
    description: new FormControl('', {nonNullable: false,validators: [],}),
    httpMethod: new FormControl<number | null>(null, {validators: [Validators.required],}),
    routeTemplate: new FormControl('', {nonNullable: false,validators: [],}),
    source: new FormControl(1, {nonNullable: true,validators: [Validators.required],}),
    allowAnonymous: new FormControl(false, {nonNullable: true,validators: [Validators.required],}),
    isActive: new FormControl(true, {nonNullable: true,validators: [Validators.required],},),
    isDeprecated: new FormControl(false, {nonNullable: true,validators: [Validators.required],},),
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
      this.service.update(this.apiResourceId!,this.userForm).subscribe({
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

