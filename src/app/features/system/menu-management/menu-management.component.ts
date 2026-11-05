import { FlatTreeControl } from '@angular/cdk/tree';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule } from '@angular/material/tree';
import { MenuCategoryDto, MenuDto, MenuOrderItem, MenuCreateCommand } from './menu-management.model';
import { MenuApiService } from './menu-management.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { MenuEditorDrawerComponent } from './menu-editor-drawer/menu-editor-drawer.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MenuCategoryDialogComponent } from './menu-category-dialog/menu-category-dialog.component';

interface MenuFlatNode {
  id: string;
  title: string;
  icon?: string | null;
  order: number;
  level: number;
  expandable: boolean;
  original: MenuDto;
}

@Component({
  
  selector: 'app-menu-management',
  standalone: true,
  templateUrl: './menu-management.component.html',
  styleUrls: ['./menu-management.component.scss'],
  imports: [
    CommonModule,
    MenuEditorDrawerComponent,
    MatSidenavModule,
    MatButtonModule,
    DragDropModule,
    MatTreeModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatListModule,
    MatToolbarModule,
    MatTooltipModule,
    ReactiveFormsModule,
    NgTemplateOutlet,
    MatDialogModule
  ]
})
export class MenuManagementPage implements OnInit {
  private readonly api = inject(MenuApiService);
  private readonly dialog = inject(MatDialog);

  categories = signal<MenuCategoryDto[]>([]);
  selectedCategory = signal<MenuCategoryDto | null>(null);
  selectedMenu = signal<MenuDto | null>(null);

  loading = signal(false);
  drawerMode = signal<'create-root' | 'create-child' | 'edit' | null>(null);

  private transformer = (node: MenuDto, level: number): MenuFlatNode => ({
    id: node.id,
    title: node.title,
    icon: node.icon,
    order: node.order,
    level,
    expandable: !!node.children?.length,
    original: node,
  });

  treeControl = new FlatTreeControl<MenuFlatNode>(
    node => node.level,
    node => node.expandable
  );

  treeFlattener = new MatTreeFlattener<MenuDto, MenuFlatNode>(
    this.transformer,
    node => node.level,
    node => node.expandable,
    node => node.children ?? []
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  hasChild = (_: number, node: MenuFlatNode) => node.expandable;

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.loading.set(true);
    this.api.getCategories().subscribe({
      next: categories => {
        const ordered = [...categories].sort((a, b) => a.order - b.order);
        this.categories.set(ordered);
        if (ordered.length > 0 && !this.selectedCategory()) {
          this.selectCategory(ordered[0]);
        }
      },
      complete: () => this.loading.set(false),
    });
  }

  selectCategory(category: MenuCategoryDto) {
    this.selectedCategory.set(category);
    this.selectedMenu.set(null);
    this.loadMenus(category.id);
  }

  loadMenus(categoryId: string) {
    this.api.getMenusByCategory(categoryId).subscribe(menus => {
      this.dataSource.data = this.sortTree(menus);
      this.treeControl.expandAll();
    });
  }

  createRootMenu() {
    this.selectedMenu.set(null);
    this.drawerMode.set('create-root');
  }

  createChildMenu(node: MenuFlatNode) {
    this.selectedMenu.set(node.original);
    this.drawerMode.set('create-child');
  }

  editMenu(node: MenuFlatNode) {
    this.selectedMenu.set(node.original);
    this.drawerMode.set('edit');
  }

  openCategoryDialog(category?: MenuCategoryDto) {
    const dialogRef = this.dialog.open(MenuCategoryDialogComponent, {
      width: '400px',
      data: category ?? null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCategories();
      }
    });
  }

  onMenuSaved(command: MenuCreateCommand) {
    const category = this.selectedCategory();
    if (!category) return;

    if (this.drawerMode() === 'edit' && this.selectedMenu()) {
      this.api.updateMenu(this.selectedMenu()!.id, command).subscribe(() => {
        this.closeDrawer();
        this.loadMenus(category.id);
      });
    } else {
      this.api.createMenu(command).subscribe(() => {
        this.closeDrawer();
        this.loadMenus(category.id);
      });
    }
  }

  closeDrawer() {
    this.drawerMode.set(null);
    this.selectedMenu.set(null);
  }

  // Categories cannot be reordered until the backend exposes that operation.
  dropCategory(_event: CdkDragDrop<MenuCategoryDto[]>) {
    console.warn('Category reorder is not yet available');
  }

dropMenu(event: CdkDragDrop<MenuFlatNode[]>) {
  const category = this.selectedCategory();
  if (!category || event.previousIndex === event.currentIndex) return;

  const flatNodes = this.treeControl.dataNodes;
  const draggedNode = flatNodes[event.previousIndex];
  const droppedNode = flatNodes[event.currentIndex];

  if (!draggedNode || !droppedNode) return;

  const draggedParentId = draggedNode.original.parentId ?? null;
  const droppedParentId = droppedNode.original.parentId ?? null;

  if (draggedParentId !== droppedParentId) {
    console.warn('Reordering across different parents is not supported.');
    return;
  }

  const siblings = this.getSiblingCollection(this.dataSource.data, draggedParentId);

  const fromIndex = siblings.findIndex(x => x.id === draggedNode.id);
  const toIndex = siblings.findIndex(x => x.id === droppedNode.id);

  if (fromIndex < 0 || toIndex < 0) return;

  moveItemInArray(siblings, fromIndex, toIndex);

  this.updateOrdersRecursive(this.dataSource.data);

  const items = this.recalculateOrders(this.dataSource.data);

  this.api.reorderMenus({
    categoryId: category.id,
    items,
  }).subscribe({
    next: () => this.loadMenus(category.id),
    error: (error) => {
      console.error('Menu reorder failed', error);
      this.loadMenus(category.id);
    }
  });
}

private getSiblingCollection(nodes: MenuDto[], parentId: string | null): MenuDto[] {
  if (parentId === null) {
    return nodes;
  }

  const parent = this.findNodeById(nodes, parentId);
  return parent?.children ?? [];
}
private findNodeById(nodes: MenuDto[], id: string): MenuDto | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }

    const found = this.findNodeById(node.children ?? [], id);
    if (found) {
      return found;
    }
  }

  return null;
}
private updateOrdersRecursive(nodes: MenuDto[]): void {
  nodes.forEach((node, index) => {
    node.order = index + 1;

    if (node.children?.length) {
      this.updateOrdersRecursive(node.children);
    }
  });
}


  deleteMenu(node: MenuFlatNode) {
    if (confirm(`آیا از حذف منوی "${node.title}" مطمئن هستید؟`)) {
      this.api.deleteMenu(node.id).subscribe(() => {
        const category = this.selectedCategory();
        if (category) {
          this.loadMenus(category.id);
        }
      });
    }
  }

  private sortTree(nodes: MenuDto[]): MenuDto[] {
    return [...nodes]
      .sort((a, b) => a.order - b.order)
      .map(node => ({
        ...node,
        children: node.children ? this.sortTree(node.children) : [],
      }));
  }

  private recalculateOrders(nodes: MenuDto[], parentId: string | null = null): MenuOrderItem[] {
    return nodes.flatMap((node, index) => [
      {
        id: node.id,
        parentId,
        order: index + 1,
      },
      ...this.recalculateOrders(node.children ?? [], node.id),
    ]);
  }
}
