import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, effect, inject, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { debounceTime, distinctUntilChanged, switchMap, catchError, of, startWith, map } from 'rxjs';
import { SelectionModel } from '@angular/cdk/collections';
import { GroupMemberDto, UserSummaryDto, UserGroupApi } from './group-users.service';
import { MatDialog } from '@angular/material/dialog';
import { UserListComponent } from '../../user/user-list/user-list.component';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { AvatarUploadComponent } from '../../../../shared/components/form-components';
import {  PageHeaderComponent, GridComponent, GridColumn, PagedList, GridQuery } from '../../../../shared/components/grid-components';
import { GridCellTemplateDirective } from '../../../../shared/directives/GridCellTemplate';
import { GroupsService } from '../groups.service';

@Component({
  selector: 'app-user-group-members',
  standalone: true,
    imports: [GridCellTemplateDirective, MatButtonModule, CommonModule, MatCardModule, MatButtonModule, MatMenuModule, MatTableModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule , AvatarUploadComponent, MatExpansionModule, MatIconModule, PageHeaderComponent, GridComponent
     
     , MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatChipsModule,
    MatMenuModule, MatPaginatorModule, MatSnackBarModule, MatProgressBarModule
  ],
  templateUrl: './user-group-members.component.html',
  styleUrls: ['./user-group-members.component.scss']
})
export class UserGroupMembersComponent implements OnChanges {
  @Input({ required: true }) groupId!: string;
    private readonly dialog = inject(MatDialog);
  service: GroupsService = inject(GroupsService);

  displayedColumns = ['select', 'displayName', 'isActive', 'actions'] as const;

  // state
  loading = signal(false);
  rows = signal<GroupMemberDto[]>([]);
  total = signal(0);

  pageIndex = signal(0);   // MatPaginator is 0-based
  pageSize  = signal(20);
  search    = signal('');
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
      sortable: true
    },
    {
      key: 'firstName',
      label: 'نام',
      type: 'text',
      sortable: true
    },
     {
      key: 'lastName',
      label: 'نام خانوادگی',
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
  load(query: GridQuery): void {
  
      this.service.membersPagedList(this.groupId,query).subscribe({
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
  // selection
  selection = new SelectionModel<GroupMemberDto>(true, [], true, (a, b) => a.userId === b.userId);

  // add single
  userSearchCtrl = new FormControl('', { nonNullable: true });
  filteredUsers$ = this.userSearchCtrl.valueChanges.pipe(
    startWith(''), 
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(q => {
      if (!q || q.length < 2) return of([] as UserSummaryDto[]);
      return this.api.searchUsers(q, this.groupId).pipe(
        catchError(() => of([] as UserSummaryDto[]))
      );
    })
  );

  constructor(private api: UserGroupApi, private snack: MatSnackBar) {
    // reload وقتی صفحه/سایز/سرچ تغییر کند
    effect(() => {
      void this.pageIndex();
      void this.pageSize();
      void this.search();
      if (this.groupId) this.fetch();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['groupId'] && this.groupId) {
      this.pageIndex.set(0);
      this.selection.clear();
      this.fetch();
    }
  }

  trackUser = (_: number, u: UserSummaryDto) => u.id;

  reload() { this.fetch(); }

  onPage(e: PageEvent) {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    // fetch توسط effect
  }

  fetch() {
    this.loading.set(true);
    this.api.getMembers(this.groupId, {
      search: this.search(),
      page: this.pageIndex() + 1,
      pageSize: this.pageSize(),
      sort: 'displayName',
      dir: 'asc',
    }).subscribe({
      next: res => {
        this.rows.set(res.data);
        this.total.set(res.totalCount);
        this.selection.clear();
      },
      error: () => this.snack.open('خطا در دریافت اعضا', 'بستن', { duration: 3000 }),
      complete: () => this.loading.set(false),
    });
  }

  // selection helpers
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.rows().length;
    return numRows > 0 && numSelected === numRows;
  }

  isIndeterminate(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.rows().length;
    return numSelected > 0 && numSelected < numRows;
  }

  toggleAll() {
    if (this.isAllSelected()) this.selection.clear();
    else this.rows().forEach(r => this.selection.select(r));
  }

  // add single
  onSelectUserToAdd(user: UserSummaryDto) {
    if (!user?.id) return;

    this.loading.set(true);
    this.api.addMembers(this.groupId, [user.id]).subscribe({
      next: () => {
        this.snack.open('عضو اضافه شد', 'بستن', { duration: 2000 });
        this.userSearchCtrl.setValue('');
        this.fetch();
      },
      error: () => this.snack.open('خطا در افزودن عضو', 'بستن', { duration: 3000 }),
      complete: () => this.loading.set(false),
    });
  }

  // remove one
  removeOne(row: GroupMemberDto) {
    this.loading.set(true);
    this.api.removeMembers(this.groupId, [row.userId]).subscribe({
      next: () => {
        this.snack.open('عضو حذف شد', 'بستن', { duration: 2000 });
        this.fetch();
      },
      error: () => this.snack.open('خطا در حذف عضو', 'بستن', { duration: 3000 }),
      complete: () => this.loading.set(false),
    });
  }

  // remove selected
  removeSelected() {
    const ids = this.selection.selected.map(x => x.userId);
    if (ids.length === 0) return;

    this.loading.set(true);
    this.api.removeMembers(this.groupId, ids).subscribe({
      next: () => {
        this.snack.open('اعضای انتخاب‌شده حذف شدند', 'بستن', { duration: 2000 });
        this.fetch();
      },
      error: () => this.snack.open('خطا در حذف گروهی', 'بستن', { duration: 3000 }),
      complete: () => this.loading.set(false),
    });
  }

  // bulk add (stub)
  openBulkAdd() {
   const dialogRef = this.dialog.open(UserListComponent, {
       width: '95vw',
  maxWidth: '95vw',
  height: '90vh',
  data:{
    isModal:true
  }
       });
   
       dialogRef.afterClosed().subscribe((result:string[]) => {
        
         if (result) {
          this.api.addMembers(this.groupId,result).subscribe(d=>{
            this.fetch();
          })
         }
       });
  }
}
