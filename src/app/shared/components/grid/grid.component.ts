import {
  AfterContentInit,
  AfterViewInit,
  Component,
  ContentChild,
  ContentChildren,
  EventEmitter,
  inject,
  Input,
  Output,
  Pipe,
  PipeTransform,
  QueryList,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCardModule } from '@angular/material/card';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { GridCellTemplateDirective } from '../../directives/GridCellTemplate';
import { GridHeaderFilterTemplateDirective } from '../../directives/GridHeaderFilterTemplate';
import { CustomizerSettingsService } from '../../services/customizer-settings.service';


export interface GridColumn {
  key: string;
  label: string;
  type?: 'text' | 'image-text' | 'currency' | 'custom';
  sortable?: boolean;
  width?: string;
  className?: string;
}

type MoneyUnit = 'toman' | 'rial';

@Pipe({
  name: 'money',
  standalone: true,
  pure: true,
})
export class MoneyPipe implements PipeTransform {
  transform(
    value: number | string | null | undefined,
    unit: MoneyUnit = 'toman',
    locale: string = 'fa-IR'
  ): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    const numericValue = Number(String(value).replace(/,/g, '').trim());

    if (isNaN(numericValue)) {
      return '-';
    }

    const formatted = new Intl.NumberFormat(locale).format(numericValue);
    const currencyLabel = unit === 'toman' ? 'تومان' : 'ریال';

    return `${formatted} ${currencyLabel}`;
  }
}

@Component({
  selector: 'app-grid',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatMenuModule,
    MatTableModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
  ],
  templateUrl: './grid.component.html',
  styleUrl: './grid.component.scss'
})
export class GridComponent<T = any> implements AfterContentInit, AfterViewInit {
  themeService: CustomizerSettingsService = inject(CustomizerSettingsService);

  @ContentChild('actionTemplate') actionTemplate?: TemplateRef<any>;
  @ContentChild('HeaderActions') HeaderActions: any;

  @ContentChildren(GridCellTemplateDirective)
  cellTemplates!: QueryList<GridCellTemplateDirective>;

  @ContentChildren(GridHeaderFilterTemplateDirective)
  headerFilterTemplates!: QueryList<GridHeaderFilterTemplateDirective>;

  @Input() autoLoad = true;
  @Input() title = '';
  @Input() addButtonText = 'Add New';
  @Input() columns: GridColumn[] = [];
  @Input() enableSearch = true;
  @Input() enableSelection = false;
  @Input() enableActions = false;
  @Input() enableAddButton = true;
  @Input() pageSize = 10;
  @Input() pageSizeOptions: number[] = [10, 25, 50];
  @Input() selectionKey = 'id';

  @Output() add = new EventEmitter<void>();
  @Output() selectionChange = new EventEmitter<T[]>();
  @Output() selectedIdsChange = new EventEmitter<any[]>();
  @Output() queryChange = new EventEmitter<GridQuery>();

  @ViewChild(MatPaginator) paginator?: MatPaginator;

  dataSource = new MatTableDataSource<T>([]);
  selection = new SelectionModel<T>(true, []);

  private _data: PagedList | null = null;
  private filters: Filter[] = [];
  private globalSearchValue = '';
  private selectedIds = new Set<any>();

  private cellTemplateMap = new Map<string, TemplateRef<any>>();
  private headerFilterTemplateMap = new Map<string, TemplateRef<any>>();

  @Input()
  set data(value: PagedList | null | undefined) {
    this._data = value ?? null;

    const rows = value?.data ?? [];
    this.dataSource.data = rows;

    this.selection.clear();

    rows.forEach(row => {
      const rowId = this.getRowId(row);
      if (rowId !== null && rowId !== undefined && this.selectedIds.has(rowId)) {
        this.selection.select(row);
      }
    });

    this.selectionChange.emit(this.selection.selected);
    this.selectedIdsChange.emit([...this.selectedIds]);

    if (this.paginator && value) {
      this.paginator.length = value.totalCount ?? 0;
      this.paginator.pageIndex = Math.max((value.pageNumber ?? 1) - 1, 0);
    }
  }

  get data(): PagedList | null {
    return this._data;
  }

  get tableData(): T[] {
    return this.data?.data ?? [];
  }

  get totalCount(): number {
    return this.data?.totalCount ?? 0;
  }

  get currentPageNumber(): number {
    return this.data?.pageNumber ?? 1;
  }

  get currentPageIndex(): number {
    return Math.max(this.currentPageNumber - 1, 0);
  }

  get hasActionColumn(): boolean {
    return this.enableActions && !!this.actionTemplate;
  }

  get displayedColumns(): string[] {
    const baseColumns = this.columns.map(column => column.key);

    if (this.enableSelection) {
      baseColumns.unshift('select');
    }

    if (this.hasActionColumn) {
      baseColumns.push('action');
    }

    return baseColumns;
  }

  ngAfterContentInit(): void {
    this.refreshTemplates();
    this.refreshHeaderFilterTemplates();

    this.cellTemplates?.changes.subscribe(() => {
      this.refreshTemplates();
    });

    this.headerFilterTemplates?.changes.subscribe(() => {
      this.refreshHeaderFilterTemplates();
    });
  }

  ngAfterViewInit(): void {
    if (this.autoLoad) {
      queueMicrotask(() => {
        this.emitQuery();
      });
    }
  }

  loadData(): void {
    this.emitQuery();
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();

    this.globalSearchValue = value;
    this.filters = this.filters.filter(f => f.filterBy !== '__global');

    if (value) {
      this.filters.push({
        filterBy: '__global',
        value,
        operatorType: 'Contains'
      });
    }

    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }

    this.emitQuery();
  }

  onPageChange(event: PageEvent): void {
    this.queryChange.emit({
      pageNumber: event.pageIndex + 1,
      pageSize: event.pageSize,
      filters: this.filters
    });
  }

  setColumnFilter(columnKey: string, value: string, operator: string): void {
    this.filters = this.filters.filter(f => f.filterBy !== columnKey);

    const normalizedValue = value?.trim();

    if (normalizedValue) {
      this.filters.push({
        filterBy: columnKey,
        value: normalizedValue,
        operatorType: operator
      });
    }

    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }

    this.emitQuery();
  }

  isRowSelected(row: T): boolean {
    const rowId = this.getRowId(row);
    return rowId !== null && rowId !== undefined && this.selectedIds.has(rowId);
  }

  isAllSelected(): boolean {
    const rows = this.dataSource.data;

    return rows.length > 0 && rows.every(row => {
      const rowId = this.getRowId(row);
      return rowId !== null && rowId !== undefined && this.selectedIds.has(rowId);
    });
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.dataSource.data.forEach(row => {
        const rowId = this.getRowId(row);
        if (rowId !== null && rowId !== undefined) {
          this.selectedIds.delete(rowId);
        }
      });

      this.selection.clear();
    } else {
      this.dataSource.data.forEach(row => {
        const rowId = this.getRowId(row);
        if (rowId !== null && rowId !== undefined) {
          this.selectedIds.add(rowId);
        }
      });

      this.selection.clear();
      this.dataSource.data.forEach(row => this.selection.select(row));
    }

    this.selectionChange.emit(this.selection.selected);
    this.selectedIdsChange.emit([...this.selectedIds]);
  }

  toggleRow(row: T): void {
    const rowId = this.getRowId(row);

    if (rowId === null || rowId === undefined) {
      return;
    }

    if (this.selectedIds.has(rowId)) {
      this.selectedIds.delete(rowId);
      this.selection.deselect(row);
    } else {
      this.selectedIds.add(rowId);
      this.selection.select(row);
    }

    this.selectionChange.emit(this.selection.selected);
    this.selectedIdsChange.emit([...this.selectedIds]);
  }

  checkboxLabel(row?: T): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }

    return `${this.isRowSelected(row) ? 'deselect' : 'select'} row`;
  }

  getSelectedIds(): any[] {
    return [...this.selectedIds];
  }

  clearSelection(): void {
    this.selectedIds.clear();
    this.selection.clear();
    this.selectionChange.emit(this.selection.selected);
    this.selectedIdsChange.emit([]);
  }

  getCellTemplate(columnKey: string): TemplateRef<any> | null {
    return this.cellTemplateMap.get(columnKey) ?? null;
  }

  getHeaderFilterTemplate(columnKey: string): TemplateRef<any> | null {
    return this.headerFilterTemplateMap.get(columnKey) ?? null;
  }

  getCellValue(row: any, key: string): any {
    return key.split('.').reduce((value, part) => value?.[part], row);
  }

  getNestedKey(baseKey: string, childKey: string): string {
    return `${baseKey}.${childKey}`;
  }

  private emitQuery(): void {
    this.queryChange.emit({
      pageNumber: (this.paginator?.pageIndex ?? 0) + 1,
      pageSize: this.paginator?.pageSize ?? this.pageSize,
      filters: this.filters
    });
  }

  private refreshTemplates(): void {
    this.cellTemplateMap.clear();

    this.cellTemplates?.forEach(template => {
      this.cellTemplateMap.set(template.columnKey, template.templateRef);
    });
  }

  private refreshHeaderFilterTemplates(): void {
    this.headerFilterTemplateMap.clear();

    this.headerFilterTemplates?.forEach(template => {
      this.headerFilterTemplateMap.set(template.columnKey, template.templateRef);
    });
  }

  private getRowId(row: any): any {
    return this.getCellValue(row, this.selectionKey);
  }
}

export interface Filter {
  filterBy: string;
  value: string;
  operatorType: string;
}

export interface PagedList {
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  data: any[];
}

export interface GridQuery {
  pageNumber: number;
  pageSize: number;
  filters: Filter[];
}
export interface modalData{
  isModal:boolean
}