import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { TenantsService } from '../tenants.service';
import { MatIconModule } from "@angular/material/icon";
import { PageHeaderComponent,CellToggleComponent,TextFilterComponent,GridComponent, PagedList, GridColumn, GridQuery ,GridHeaderFilterTemplateDirective,GridCellTemplateDirective} from '../../../../shared/components/grid-components';
import { AvatarUploadComponent } from '../../../../shared/components/form-components';
import { CustomizerSettingsService } from '../../../../shared/services/customizer-settings.service';


@Component({
  selector: 'app-tenant-list.component',
    imports: [GridHeaderFilterTemplateDirective, GridCellTemplateDirective, MatButtonModule, CommonModule, MatCardModule, MatButtonModule, MatMenuModule, MatTableModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, RouterLink, AvatarUploadComponent, MatExpansionModule, TextFilterComponent, CellToggleComponent, MatIconModule, PageHeaderComponent, GridComponent],
  templateUrl: './tenant-list.component.html',
  styleUrl: './tenant-list.component.scss',
})
export class TenantListComponent {

  themeService: CustomizerSettingsService = inject(CustomizerSettingsService);
  service: TenantsService = inject(TenantsService);

list = signal<PagedList | null>(null);

  columns: GridColumn[] = [
   {
      key: 'logo',
      label: '',
    },
    {
      key: 'name',
      label: 'نام ',
      type: 'text',
      sortable: true
    },
     {
      key: 'slug',
      label: 'اسم مستعار',
      type: 'text',
      sortable: true
    },
     {
      key: 'isActive',
      label: 'فعال/غیرفعال',
      type: 'text',
      sortable: true
    },
  ];
changeState(id:string){
this.service.changeState(id).subscribe({
  next:v=>{
    
  }
})
}
  loadUsers(query: GridQuery): void {

    this.service.pagedList(query).subscribe({
      next: (res) => {

       this.list.set({
  pageNumber: res.pageNumber,
  totalPages: res.totalPages,
  totalCount: res.totalCount,
  data: res.data ?? []
});
      },
      error: (err) => {
        
        console.error(err);
      }
    });
  }
}



