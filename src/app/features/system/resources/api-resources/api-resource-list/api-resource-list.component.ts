import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, Input, signal } from '@angular/core';
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

import { ApiResourcesService } from '../api-resources.service';
import {
  PageHeaderComponent,
GridCellTemplateDirective,
GridHeaderFilterTemplateDirective,
GridComponent,
TextFilterComponent,
SelectFilterComponent,
CellToggleComponent,
GridQuery,
GridColumn,
PagedList
}from '../../../../../shared/components/grid-components'
import { ResourcesService } from '../../resources.service';
import { CustomizerSettingsService } from '../../../../../shared/services/customizer-settings.service';
@Component({
  selector: 'app-api-resource-list',
    imports: [GridHeaderFilterTemplateDirective, GridCellTemplateDirective, MatButtonModule, CommonModule, MatCardModule, MatButtonModule, MatMenuModule, MatTableModule, MatCheckboxModule, MatPaginatorModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, GridComponent, RouterLink, MatExpansionModule, TextFilterComponent, CellToggleComponent, MatIconModule, SelectFilterComponent, PageHeaderComponent],
  templateUrl: './api-resource-list.component.html',
  styleUrl: './api-resource-list.component.scss',
})
export class ApiResourceListComponent implements AfterViewInit {
@Input() resourceId?:string;
  themeService: CustomizerSettingsService = inject(CustomizerSettingsService);
  resourceService:ResourcesService=inject(ResourcesService)

  service: ApiResourcesService = inject(ApiResourcesService);

list = signal<PagedList | null>(null);

  columns: GridColumn[] = [
    {
      key: 'key',
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
      key: 'resource',
      label: 'منبع ',
      type: 'text',
      sortable: true
    },
     {
      key: 'httpMethod',
      label: 'HttpMethod',
      type: 'text',
      sortable: true
    },
    {
      key: 'routeTemplate',
      label: 'قالب مسیر',
      type: 'text',
      sortable: true
    },
     {
      key: 'isDeprecated',
      label: 'منقضی شده',
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
this.resourceService.getLookup().subscribe({
      next:x=>{this.modules.set(x)}
    })
  }
changeState(id:string){
this.service.changeState(id).subscribe({
  next:v=>{
    
  }
})
}
sync(){
  this.service.sync(this.resourceId).subscribe(
    {
    next:()=>{
              this.reload()
  }})
}
reload(){
  const query:GridQuery={filters:[],pageNumber:1,pageSize:10}
  this.loadList(query)
}
  private lastQuery: GridQuery = { pageNumber: 1, pageSize: 10, filters: [] };

  remove(id: string): void {
    if (!confirm('آیا از حذف این مورد مطمئن هستید؟')) return;
    this.service.delete(id).subscribe({
      next: () => this.loadList(this.lastQuery),
      error: () => alert('حذف انجام نشد؛ ممکن است این مورد وابستگی یا محدودیت دسترسی داشته باشد.'),
    });
  }

  loadList(query: GridQuery): void {
    this.lastQuery = query;

    (this.resourceId ? this.service.ChildpagedList(this.resourceId, query) : this.service.pagedList(query)).subscribe({
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



