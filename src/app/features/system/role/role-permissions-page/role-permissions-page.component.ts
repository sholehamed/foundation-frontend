import { Component, Input, input, OnInit, signal, ViewChild } from '@angular/core';
import { finalize } from 'rxjs';
import { RolePermissionTreeComponent } from '../role-permission-tree/role-permission-tree.component';
import { RolePermissionTreeNode, RolesService } from '../roles.service';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { PageHeaderComponent } from '../../../../shared/components/form-components';

@Component({
  selector: 'app-role-permissions-page',
  templateUrl: './role-permissions-page.component.html',
  styleUrls: ['./role-permissions-page.component.scss'],
  imports: [
    MatIconModule,
    RolePermissionTreeComponent,
    MatProgressBarModule,
    CommonModule,
    MatButtonModule,
    PageHeaderComponent,
  ],
})
export class RolePermissionsPageComponent implements OnInit {
  @ViewChild(RolePermissionTreeComponent)
  permissionTree!: RolePermissionTreeComponent;
  isSaving = false;

  roleId = input.required<string>();

  nodes = signal<RolePermissionTreeNode[]>([]);
  selectedPermissionIds = signal<string[]>([]);

  loading = false;
  saving = false;

  constructor(private readonly rolePermissionService: RolesService) {}

  ngOnInit(): void {
    this.loadPermissions();
  }

  loadPermissions(): void {
    this.loading = true;

    this.rolePermissionService
      .getRolePermissionTreeNodes(this.roleId())
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (result) => {
          this.nodes.set(result.nodes);
          this.selectedPermissionIds.set(result.selectedPermissionIds);
        },
        error: () => {
          // اینجا toast/snackbar خودتان را صدا بزنید
        },
      });
  }

  save(): void {
    const permissionIds = this.permissionTree.getSelectedPermissionIds();

    this.saving = true;

    this.rolePermissionService
      .updateRolePermissions(this.roleId(), permissionIds)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          // اینجا پیام موفقیت نمایش بدهید
        },
        error: () => {
          // اینجا پیام خطا نمایش بدهید
        },
      });
  }
  onPermissionSelectionChanged(permissionIds: string[]): void {
    this.selectedPermissionIds.set(permissionIds);

    console.log('selected permissions:', this.selectedPermissionIds);
  }
}
