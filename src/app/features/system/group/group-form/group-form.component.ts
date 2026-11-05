import { AfterViewInit, Component, inject, Input } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { PageHeaderComponent } from '../../../../shared/components/grid-components';
import { BaseFormComponent, CustomInputComponent,CustomTextEreaComponent,CustomToggleComponent } from '../../../../shared/components/form-components';
import{Location} from '@angular/common'
import { GroupsService } from '../groups.service';
import { CustomizerSettingsService } from '../../../../shared/services/customizer-settings.service';
@Component({
  selector: 'app-group-form.component',
    imports: [ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, CustomInputComponent, CustomToggleComponent, CustomInputComponent, CustomTextEreaComponent, PageHeaderComponent],
  templateUrl: './group-form.component.html',
  styleUrl: './group-form.component.scss',
})
export class GroupFormComponent extends BaseFormComponent implements AfterViewInit {
  override backUrl?: any[]=['/system/groups'];
  @Input() groupId?:string;
  ngAfterViewInit(): void {
  }
  
themeService:CustomizerSettingsService=inject(CustomizerSettingsService)
_loc:Location=inject(Location)
service:GroupsService=inject(GroupsService)
update:boolean=false;

ngOnInit() {
  

  if (this.groupId) {
    this.update=true
    this.load();
  }
}
 
load(){
  this.service.getById(this.groupId).subscribe({
     next: (item:any) => {
      
      this.form.patchValue(item);
    },
  })
}
form = new FormGroup({
    name: new FormControl('', {
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
      this.service.update(this.groupId,this.form).subscribe({
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

