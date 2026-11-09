import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TenantOwnedMenuCategory {
  id: string;
  title: string;
  sortOrder: number;
  isActive: boolean;
  version: string;
}
export interface TenantOwnedMenuItem {
  id: string;
  categoryId: string;
  parentId: string | null;
  title: string;
  icon: string | null;
  route: string | null;
  sortOrder: number;
  isActive: boolean;
  version: string;
}
export interface TenantOwnedMenuCatalog {
  categories: TenantOwnedMenuCategory[];
  items: TenantOwnedMenuItem[];
  canManage: boolean;
}
export interface OwnedMenuCategoryCreate {
  title: string;
  sortOrder: number;
}
export interface OwnedMenuCategoryUpdate extends OwnedMenuCategoryCreate {
  isActive: boolean;
  expectedVersion: string;
}
export interface OwnedMenuItemCreate {
  categoryId: string;
  parentId: string | null;
  title: string;
  icon: string | null;
  route: string | null;
  sortOrder: number;
}
export interface OwnedMenuItemUpdate extends Omit<OwnedMenuItemCreate, 'categoryId'> {
  isActive: boolean;
  expectedVersion: string;
}

/** FR-14C-2B. No arbitrary TenantId, actor, role or permission input is sent. */
@Injectable({ providedIn: 'root' })
export class TenantOwnedMenuEditorService {
  private readonly http = inject(HttpClient);
  private readonly root = environment.apiUrl + '/tenant/workspace/navigation/catalog';

  get(): Observable<TenantOwnedMenuCatalog> {
    return this.http.get<TenantOwnedMenuCatalog>(this.root);
  }

  createCategory(input: OwnedMenuCategoryCreate): Observable<TenantOwnedMenuCategory> {
    return this.http.post<TenantOwnedMenuCategory>(this.root + '/categories', input);
  }

  updateCategory(id: string, input: OwnedMenuCategoryUpdate):
      Observable<TenantOwnedMenuCategory> {
    return this.http.put<TenantOwnedMenuCategory>(
      this.root + '/categories/' + encodeURIComponent(id), input);
  }

  createItem(input: OwnedMenuItemCreate): Observable<TenantOwnedMenuItem> {
    return this.http.post<TenantOwnedMenuItem>(this.root + '/items', input);
  }

  updateItem(id: string, input: OwnedMenuItemUpdate):
      Observable<TenantOwnedMenuItem> {
    return this.http.put<TenantOwnedMenuItem>(
      this.root + '/items/' + encodeURIComponent(id), input);
  }
}
