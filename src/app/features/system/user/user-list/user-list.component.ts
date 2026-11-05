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
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { CellToggleComponent } from '../../../../shared/components/cell-toggle.component';
import { AvatarUploadComponent } from '../../../../shared/components/form-components';
import {
  TextFilterComponent,
  PageHeaderComponent,
  GridComponent,
  PagedList,
  GridColumn,
  GridQuery,
  modalData,
} from '../../../../shared/components/grid-components';
import { GridCellTemplateDirective } from '../../../../shared/directives/GridCellTemplate';
import { GridHeaderFilterTemplateDirective } from '../../../../shared/directives/GridHeaderFilterTemplate';
import { UsersService } from '../users.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CustomizerSettingsService } from '../../../../shared/services/customizer-settings.service';

@Component({
  selector: 'app-user-list.component',
  imports: [
    GridHeaderFilterTemplateDirective,
    GridCellTemplateDirective,
    MatButtonModule,
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatMenuModule,
    MatTableModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    RouterLink,
    AvatarUploadComponent,
    MatExpansionModule,
    TextFilterComponent,
    CellToggleComponent,
    MatIconModule,
    PageHeaderComponent,
    GridComponent,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent {
  themeService: CustomizerSettingsService = inject(CustomizerSettingsService);
  service: UsersService = inject(UsersService);
  _selectedIds: string[] = [];
  public readonly dialogData = inject<modalData | null>(MAT_DIALOG_DATA, { optional: true });

  private readonly dialogRef = inject<MatDialogRef<UserListComponent> | null>(MatDialogRef, {
    optional: true,
  });
  list = signal<PagedList | null>(null);

  columns: GridColumn[] = [
    {
      key: 'avatar',
      label: '',
    },
    {
      key: 'userName',
      label: 'نام کاربری ',
      type: 'text',
      sortable: true,
    },
    {
      key: 'firstName',
      label: 'نام',
      type: 'text',
      sortable: true,
    },
    {
      key: 'lastName',
      label: 'نام خانوادگی',
      type: 'text',
      sortable: true,
    },
    {
      key: 'email',
      label: 'ایمیل',
      type: 'text',
      sortable: true,
    },
    {
      key: 'isActive',
      label: 'فعال/غیرفعال',
      type: 'text',
      sortable: true,
    },
    {
      key: 'isLockedOut',
      label: 'قفل/غیرفعال',
      type: 'text',
      sortable: true,
    },
  ];
  changeState(id: string) {
    this.service.changeState(id).subscribe({
      next: (v) => {},
    });
  }
  changeLockState(id: string) {
    this.service.changeLockState(id).subscribe({
      next: (v) => {},
    });
  }
  loadUsers(query: GridQuery): void {
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
  closeDialog() {
    this.dialogRef!.close(this._selectedIds);
  }
  idsChanged(event: string[]) {
    this._selectedIds = event;
  }
}
