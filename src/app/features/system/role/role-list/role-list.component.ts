import { Component, inject, signal } from '@angular/core';
import { CellToggleComponent, GridCellTemplateDirective, GridColumn, GridComponent, GridHeaderFilterTemplateDirective, GridQuery, PagedList, PageHeaderComponent, TextFilterComponent } from '../../../../shared/components/grid-components';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { RolesService } from '../roles.service';
import { CustomizerSettingsService } from '../../../../shared/services/customizer-settings.service';

@Component({
  selector: 'app-role-list.component',
    imports: [GridHeaderFilterTemplateDirective, GridCellTemplateDirective, MatButtonModule, CommonModule, MatCardModule, MatMenuModule, MatTableModule, MatPaginatorModule, MatFormFieldModule, GridComponent, RouterLink, MatExpansionModule, TextFilterComponent, CellToggleComponent, MatIconModule, PageHeaderComponent],
  templateUrl: './role-list.component.html',
  styleUrl: './role-list.component.scss',
})
export class RoleListComponent {

  themeService: CustomizerSettingsService = inject(CustomizerSettingsService);
  service:RolesService=inject(RolesService)


list = signal<PagedList | null>(null);

  columns: GridColumn[] = [
   
     {
      key: 'name',
      label: 'عنوان ',
      type: 'text',
      sortable: true
    },
     {
      key: 'description',
      label: 'توضیحات',
      type: 'text',
      sortable: true
    },
     {
      key: 'isActive',
      label: 'فعال/غیرفعال',
      sortable: true
    },
  ];
   modules=signal<any|null>([])

  
changeState(id:string){
this.service.changeState(id).subscribe({
  next:v=>{
    
  }
})
}
  loadList(query: GridQuery): void {

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

