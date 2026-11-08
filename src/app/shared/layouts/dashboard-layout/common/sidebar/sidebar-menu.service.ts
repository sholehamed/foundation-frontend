import { CurrentUiAccessSnapshot, isRouteAllowed } from '../../../../permissions/system-ui-access.service';
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


/** Use the same live registered PAGE decisions as the global System router.
 * Unregistered URLs and external links are hidden in enforced mode. This
 * filters *presentation* only; the API still requires authorization. */
export function filterSystemNavigation(
  categories: MenuCategoryDto[],
  snapshot: CurrentUiAccessSnapshot | null,
): MenuCategoryDto[] {
  const clean = (items: MenuDto[]): MenuDto[] => items.flatMap(item => {
    const childs = clean(item.childs ?? []);
    if (item.route) {
      if (!isRouteAllowed(snapshot, item.route)) return [];
    } else if (item.externalUrl || childs.length === 0) {
      return [];
    }
    return [{ ...item, childs }];
  });

  return categories.flatMap(section => {
    const items = clean(section.items);
    return items.length > 0 ? [{ ...section, items }] : [];
  });
}
