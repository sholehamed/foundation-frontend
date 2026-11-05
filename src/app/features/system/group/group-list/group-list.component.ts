import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { CellToggleComponent } from '../../../../shared/components/cell-toggle.component';
import {
  GridComponent,
  TextFilterComponent,
  PageHeaderComponent,
  PagedList,
  GridColumn,
  GridQuery,
} from '../../../../shared/components/grid-components';
import { GridCellTemplateDirective } from '../../../../shared/directives/GridCellTemplate';
import { GridHeaderFilterTemplateDirective } from '../../../../shared/directives/GridHeaderFilterTemplate';
import { GroupsService } from '../groups.service';
import { CustomizerSettingsService } from '../../../../shared/services/customizer-settings.service';

@Component({
  selector: 'app-group-list.component',
  imports: [
    GridHeaderFilterTemplateDirective,
    GridCellTemplateDirective,
    MatButtonModule,
    CommonModule,
    MatMenuModule,
    MatFormFieldModule,
    GridComponent,
    RouterLink,
    TextFilterComponent,
    CellToggleComponent,
    MatIconModule,
    PageHeaderComponent,
  ],
  templateUrl: './group-list.component.html',
  styleUrl: './group-list.component.scss',
})
export class GroupListComponent {
  themeService: CustomizerSettingsService = inject(CustomizerSettingsService);
  service: GroupsService = inject(GroupsService);

  list = signal<PagedList | null>(null);

  columns: GridColumn[] = [
    {
      key: 'name',
      label: 'عنوان ',
      type: 'text',
      sortable: true,
    },
    {
      key: 'description',
      label: 'توضیحات',
      type: 'text',
      sortable: true,
    },
    {
      key: 'isActive',
      label: 'فعال/غیرفعال',
      sortable: true,
    },
  ];
  modules = signal<any | null>([]);

  changeState(id: string) {
    this.service.changeState(id).subscribe({
      next: (v) => {},
    });
  }
  loadList(query: GridQuery): void {
    this.service.pagedList(query).subscribe({
      next: (res) => {
        this.list.set({
          pageNumber: res.pageNumber,
          totalPages: res.totalPages,
          totalCount: res.totalCount,
          data: res.data ?? [],
        });
      },
      error: (err) => {
        console.error(err);
      },
    });
  }
}
