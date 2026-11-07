import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

export interface MenuCategoryDto {
  title: string;
  items: MenuDto[];
}

export interface MenuDto {
  title: string;
  icon?: string | null;
  route?: string | null;
  externalUrl?: string | null;
  childs: MenuDto[];
}

@Injectable({ providedIn: 'root' })
export class SidebarMenuService {
  private readonly url = environment.apiUrl + '/system/Menus/me';

  constructor(private http: HttpClient) {}

  /** Current authenticated user, across all scoped roles and groups.
   * Never select RoleId/TenantId in the client or fall back to admin links. */
  getMyNavigation(): Observable<MenuCategoryDto[]> {
    return this.http.get<MenuCategoryDto[]>(this.url);
  }
}
