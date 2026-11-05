import { inject, Injectable } from "@angular/core";
import { MenuCategoryCreateCommand, MenuCategoryDto, MenuCategoryReorderCommand, MenuCreateCommand, MenuDto, MenuReorderCommand } from "./menu-management.model";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";

@Injectable({ providedIn: 'root' })
export class MenuApiService {
  private readonly http = inject(HttpClient);

  getCategories() {
    return this.http.get<MenuCategoryDto[]>(environment.apiUrl+'/system/MenuCategories/list');
  }

  createCategory(command: MenuCategoryCreateCommand) {
    return this.http.post<string>(environment.apiUrl+'/system/MenuCategories', command);
  }

  updateCategory(id: string, command: Partial<MenuCategoryCreateCommand>) {
    return this.http.put<void>(environment.apiUrl+'/system/MenuCategories', { ...command, id });
  }

  reorderCategories(command: MenuCategoryReorderCommand) {
    throw new Error('Category reorder API is not implemented on the backend');
  }

  getMenusByCategory(categoryId: string) {
    return this.http.get<MenuDto[]>(environment.apiUrl+`/system/MenuCategories/${categoryId}/menus`);
  }

  createMenu(command: MenuCreateCommand) {
    return this.http.post<string>(environment.apiUrl+'/system/menus', command);
  }

  updateMenu(id: string, command: Partial<MenuCreateCommand>) {
    return this.http.put<void>(environment.apiUrl+`/system/menus/${id}`, command);
  }

  deleteMenu(id: string) {
    return this.http.delete<void>(environment.apiUrl+`/system/menus/${id}`);
  }

  reorderMenus(command: MenuReorderCommand) {
    return this.http.post<void>(environment.apiUrl+'/system/menus/reorder', command);
  }
}
