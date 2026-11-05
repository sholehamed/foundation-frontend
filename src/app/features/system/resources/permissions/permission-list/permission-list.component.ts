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
import { ModulesService } from '../../../modules/modules.service';
import { PermissionsService } from '../permissions.service';
import { CustomizerSettingsService } from '../../../../../shared/services/customizer-settings.service';
@Component({
  selector: 'app-permission-list',
    imports: [GridHeaderFilterTemplateDirective, GridCellTemplateDirective, MatButtonModule, CommonModule, MatCardModule, MatButtonModule, MatMenuModule, MatTableModule, MatCheckboxModule, MatPaginatorModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, GridComponent, RouterLink, MatExpansionModule, CellToggleComponent, MatIconModule, SelectFilterComponent, PageHeaderComponent, TextFilterComponent],
  templateUrl: './permission-list.component.html',
  styleUrl: './permission-list.component.scss',
})
export class PermissionListComponent implements AfterViewInit {
@Input() resourceId?:string;

  themeService: CustomizerSettingsService = inject(CustomizerSettingsService);
  moduleService:ModulesService=inject(ModulesService)

  service: PermissionsService = inject(PermissionsService);

list = signal<PagedList | null>(null);

  columns: GridColumn[] = [
    {
      key: 'code',
      label: 'کد ',
      type: 'text',
      sortable: true
    },
     {
      key: 'name',
      label: 'نام ',
      type: 'text',
      sortable: true
    },
     {
      key: 'resource',
      label: 'منبع',
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


