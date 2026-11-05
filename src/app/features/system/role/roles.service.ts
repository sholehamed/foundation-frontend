import {  Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaseService } from '../../../shared/services/base.service';



@Injectable({
    providedIn: 'root'
})
export class RolesService extends BaseService {
    constructor(){
        super('/system/Roles/')
    }
    getRolePermissionTree(roleId: string): Observable<RolePermissionTreeResponse> {
    return this.http.get<RolePermissionTreeResponse>(
      `${this.baseUrl}${roleId}/permissions/tree`
    );
  }

  updateRolePermissions(
    roleId: string,
    permissionIds: string[]
  ): Observable<void> {
    const request: UpdateRolePermissionsRequest = {
      permissionIds
    };

    return this.http.put<void>(
      `${this.baseUrl}${roleId}/permissions`,
      request
    );
  }

  getRolePermissionTreeNodes(roleId: string): Observable<{
    nodes: RolePermissionTreeNode[];
    selectedPermissionIds: string[];
  }> {
    return this.getRolePermissionTree(roleId).pipe(
      map(response => ({
        nodes: this.buildTree(response.modules),
        selectedPermissionIds: response.selectedPermissionIds
      }))
    );
  }

  private buildTree(modules: ModulePermissionDto[]): RolePermissionTreeNode[] {
    
    return [...modules]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(module => ({
        id: module.id,
        type: 'module',
        code: module.code,
        title: module.title,
        description: module.description,
        isActive: module.isActive,
        children: [...(module.resources ?? [])]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(resource => ({
            id: resource.id,
            type: 'resource',
            code: resource.code,
            title: resource.title,
            description: resource.description,
            isActive: resource.isActive,
            children: [...(resource.permissions ?? [])]
              .sort((a, b) => a.code.localeCompare(b.code))
              .map(permission => ({
                id: permission.id,
                type: 'permission',
                code: permission.code,
                title: permission.name,
                description: permission.description,
                isActive: permission.isActive
              }))
          }))
      }));
  }
}

export interface RolePermissionTreeResponse {
  modules: ModulePermissionDto[];
  selectedPermissionIds: string[];
}

export interface ModulePermissionDto {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  resources: ResourcePermissionDto[];
}

export interface ResourcePermissionDto {
  id: string;
  moduleId: string;
  code: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  permissions: PermissionDto[];
}

export interface PermissionDto {
  id: string;
  resourceId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface UpdateRolePermissionsRequest {
  permissionIds: string[];
}

export type RolePermissionNodeType = 'module' | 'resource' | 'permission';

export interface RolePermissionTreeNode {
  id: string;
  type: RolePermissionNodeType;
  code: string;
  title: string;
  description?: string | null;
  isActive: boolean;
  children?: RolePermissionTreeNode[];
}