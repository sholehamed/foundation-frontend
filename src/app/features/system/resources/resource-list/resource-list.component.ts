import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, signal } from '@angular/core';
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

import { ModulesService } from '../../modules/modules.service';
import { ResourcesService } from '../resources.service';

import {   PageHeaderComponent,
GridCellTemplateDirective,
GridHeaderFilterTemplateDirective,
GridComponent,
TextFilterComponent,
SelectFilterComponent,
CellToggleComponent,
GridQuery,
GridColumn,
PagedList } from '../../../../shared/components/grid-components';
import { CustomizerSettingsService } from '../../../../shared/services/customizer-settings.service';
@Component({
  selector: 'app-resource-list.component',
    imports: [GridHeaderFilterTemplateDirective, GridCellTemplateDirective, MatButtonModule, CommonModule, MatCardModule, MatButtonModule, MatMenuModule, MatTableModule, MatCheckboxModule, MatPaginatorModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, GridComponent, RouterLink, MatExpansionModule, TextFilterComponent, CellToggleComponent, MatIconModule, SelectFilterComponent, PageHeaderComponent],
  templateUrl: './resource-list.component.html',
  styleUrl: './resource-list.component.scss',
})
export class ResourceListComponent implements AfterViewInit {

  themeService: CustomizerSettingsService = inject(CustomizerSettingsService);
  moduleService:ModulesService=inject(ModulesService)

  service: ResourcesService = inject(ResourcesService);

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
      label: 'عنوان ',
      type: 'text',
      sortable: true
    },
     {
      key: 'module',
      label: 'ماژول',
      type: 'text',
      sortable: true
    },
    {
      key: 'sortOrder',
      label: 'اولویت',
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
  ngAfterViewInit(): void {
    this.searchModule()
  }
  searchModule(text?:string){
this.moduleService.getLookup().subscribe({
      next:x=>{this.modules.set(x)}
    })
  }
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



