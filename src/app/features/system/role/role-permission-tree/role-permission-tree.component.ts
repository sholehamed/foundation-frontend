import { SelectionModel } from '@angular/cdk/collections';
import { NestedTreeControl } from '@angular/cdk/tree';
import { CommonModule, NgClass } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { RolePermissionTreeNode } from '../roles.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-role-permission-tree',
  standalone: true,
  templateUrl: './role-permission-tree.component.html',
  styleUrls: ['./role-permission-tree.component.scss'],
  imports: [
    CommonModule,
    NgClass,
    MatTreeModule,
    MatIconModule,
    MatCheckboxModule,
    MatTooltipModule,MatButtonModule
  ]
})
export class RolePermissionTreeComponent implements OnChanges {
  @Input() nodes: RolePermissionTreeNode[] = [];
  @Input() selectedPermissionIds: string[] = [];
  @Input() disabled = false;

  @Output() selectionChanged = new EventEmitter<string[]>();

  treeControl = new NestedTreeControl<RolePermissionTreeNode>(
    node => node.children ?? []
  );

  dataSource = new MatTreeNestedDataSource<RolePermissionTreeNode>();

  private readonly selection = new SelectionModel<string>(true);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['nodes']) {
      const data = this.nodes ?? [];

      this.dataSource.data = data;
      this.treeControl.dataNodes = data;

      queueMicrotask(() => {
        this.expandFirstLevel();
      });
    }

    if (changes['selectedPermissionIds']) {
      this.selection.clear();

      for (const permissionId of this.selectedPermissionIds ?? []) {
        this.selection.select(permissionId);
      }
    }
  }

  hasChild = (_: number, node: RolePermissionTreeNode): boolean => {
    return !!node.children && node.children.length > 0;
  };

  getSelectedPermissionIds(): string[] {
    return [...this.selection.selected];
  }

  isSelected(node: RolePermissionTreeNode): boolean {
    if (node.type === 'permission') {
      return this.selection.isSelected(node.id);
    }

    const permissions = this.getActivePermissionDescendants(node);

    return permissions.length > 0 &&
      permissions.every(permission => this.selection.isSelected(permission.id));
  }

  isIndeterminate(node: RolePermissionTreeNode): boolean {
    if (node.type === 'permission') {
      return false;
    }

    const permissions = this.getActivePermissionDescendants(node);

    if (permissions.length === 0) {
      return false;
    }

    const selectedCount = permissions.filter(permission =>
      this.selection.isSelected(permission.id)
    ).length;

    return selectedCount > 0 && selectedCount < permissions.length;
  }

 toggleNode(node: RolePermissionTreeNode, checked: boolean): void {
 
  if (this.disabled) {
    return;
  }

  if (!node.isActive) {
    return;
  }

  if (node.type === 'permission') {
    if (checked) {
      this.selection.select(node.id);
    } else {
      this.selection.deselect(node.id);
    }

    this.emitSelection();
    return;
  }

  const permissions = this.getActivePermissionDescendants(node);

  for (const permission of permissions) {
    if (checked) {
      this.selection.select(permission.id);
    } else {
      this.selection.deselect(permission.id);
    }
  }

  this.emitSelection();
}
  getNodeTypeTitle(node: RolePermissionTreeNode): string {
    switch (node.type) {
      case 'module':
        return 'ماژول';
      case 'resource':
        return 'منبع';
      case 'permission':
        return 'دسترسی';
    }
  }

  getNodeLevelClass(node: RolePermissionTreeNode): string {
  return `permission-tree__row--${node.type}`;
}

  private emitSelection(): void {
    this.selectionChanged.emit(this.getSelectedPermissionIds());
  }

  private getActivePermissionDescendants(
    node: RolePermissionTreeNode
  ): RolePermissionTreeNode[] {
    return this.getPermissionDescendants(node)
      .filter(permission => permission.isActive);
  }

  private getPermissionDescendants(
    node: RolePermissionTreeNode
  ): RolePermissionTreeNode[] {
    const result: RolePermissionTreeNode[] = [];

    const collect = (current: RolePermissionTreeNode): void => {
      if (current.type === 'permission') {
        result.push(current);
        return;
      }

      for (const child of current.children ?? []) {
        collect(child);
      }
    };

    collect(node);

    return result;
  }
hasAnyActivePermission(node: RolePermissionTreeNode): boolean {
  return this.getActivePermissionDescendants(node).length > 0;
}
  private expandFirstLevel(): void {
    for (const node of this.nodes ?? []) {
      this.treeControl.expand(node);
    }
  }
}
