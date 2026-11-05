// model.ts
export interface SidebarRole {
  id: string;
  title: string;
}

export interface MenuCategoryDto {
  title: string;
  items: MenuDto[];
}

export interface MenuDto {
  route?: string;
  title: string;
  icon: string;
  childs: MenuDto[];
}

export type SidebarMenuSection = MenuCategoryDto;
// sidebar-menu.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SidebarMenuService {
  private readonly apiUrl = environment.apiUrl+'/system/'; // آدرس API خود را تنظیم کنید

  constructor(private http: HttpClient) {}

  getRoles(): Observable<SidebarRole[]> {
    return this.http.get<SidebarRole[]>(`${this.apiUrl}Roles/lookup`);
  }

  getMenuByRole(roleId: string): Observable<MenuCategoryDto[]> {
    return this.http.get<MenuCategoryDto[]>(`${this.apiUrl}Menus/getUserMenus?roleId=${roleId}`);
  }
}
