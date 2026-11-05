import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';

import { ModulesService } from '../modules.service';

import { GridComponent, TextFilterComponent, PagedList, GridColumn, GridQuery,GridCellTemplateDirective,GridHeaderFilterTemplateDirective } from '../../../../shared/components/grid-components';
import { CustomizerSettingsService } from '../../../../shared/services/customizer-settings.service';
import { CellToggleComponent, PageHeaderComponent } from '../../../../shared/components/grid-components';


@Component({
  selector: 'app-module-list',
    imports: [GridHeaderFilterTemplateDirective, GridCellTemplateDirective, MatButtonModule, CommonModule, MatCardModule, MatButtonModule, MatMenuModule, MatTableModule, MatCheckboxModule, MatPaginatorModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, GridComponent, RouterLink, MatExpansionModule, TextFilterComponent, CellToggleComponent, MatIconModule, PageHeaderComponent],
  templateUrl: './module-list.component.html',
  styleUrl: './module-list.component.scss',
})
export class ModuleListComponent {

  themeService: CustomizerSettingsService = inject(CustomizerSettingsService);
  service: ModulesService = inject(ModulesService);

list = signal<PagedList | null>(null);

  columns: GridColumn[] = [
   
    {
      key: 'code',
      label: 'کد ',
      type: 'text',
      sortable: true
    },
     {
      key: 'title',
      label: 'عنوان',
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



