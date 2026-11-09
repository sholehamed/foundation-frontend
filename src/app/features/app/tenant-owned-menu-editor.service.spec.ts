import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { routes } from '../../app.routes';
import {
  TenantOwnedMenuEditorService, TenantOwnedMenuCatalog,
} from './tenant-owned-menu-editor.service';
import { tenantNavigationOwnerEditorGuard } from './tenant-navigation-owner-editor.guard';
import { environment } from '../../../environments/environment';
import { environment as prod } from '../../../environments/environment.prod';
import { environment as bff } from '../../../environments/environment.bff-pilot.e2e';

describe('FR-14C-2B Tenant owner menu editor boundaries', () => {
  let api: TenantOwnedMenuEditorService;
  let http: HttpTestingController;
  const root = environment.apiUrl + '/tenant/workspace/navigation/catalog';
  const category = {
    id: '88888888-8888-4888-8888-888888888888',
    title: 'Operations', isActive: true, sortOrder: 1,
    version: 'AQIDBAUGBwg=',
  };
  const item = {
    id: '99999999-9999-4999-8999-999999999999',
    categoryId: category.id, parentId: null,
    title: 'Home', icon: 'home', route: '/dashboard',
    isActive: true, sortOrder: 1, version: 'AQIDBAUGBwg=',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(TenantOwnedMenuEditorService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('is OFF in every environment and behind an independent PAGE guard', () => {
    for (const config of [environment, prod, bff]) {
      expect(config.tenantNavigationEditorPilotEnabled).toBe(false);
    }
    const dashboard = routes.find(x => x.path === 'dashboard');
    const editor = dashboard?.children?.find(x => x.path === 'navigation');
    expect(editor?.canActivate).toContain(tenantNavigationOwnerEditorGuard);
    expect(editor?.loadComponent).toBeDefined();
  });

  it('GET sends no tenant/actor/role query and accepts no fallback catalog', () => {
    const expected: TenantOwnedMenuCatalog = {
      categories: [category], items: [item], canManage: true,
    };
    api.get().subscribe(x => expect(x).toEqual(expected));
    const request = http.expectOne(root);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual([]);
    expect(request.request.body).toBeNull();
    request.flush(expected);
  });

  it('creates only narrow owner-controlled category and item metadata', () => {
    api.createCategory({ title: 'Operations', sortOrder: 1 }).subscribe();
    const cat = http.expectOne(root + '/categories');
    expect(cat.request.body).toEqual({ title: 'Operations', sortOrder: 1 });
    cat.flush(category);

    api.createItem({
      categoryId: category.id, parentId: null,
      title: 'Home', icon: 'home', route: '/dashboard', sortOrder: 1,
    }).subscribe();
    const itemRequest = http.expectOne(root + '/items');
    expect(Object.keys(itemRequest.request.body).sort()).toEqual([
      'categoryId', 'icon', 'parentId', 'route', 'sortOrder', 'title',
    ]);
    expect(itemRequest.request.body).not.toHaveProperty('tenantId');
    itemRequest.flush(item);
  });

  it('updates immutable category ownership without sending categoryId', () => {
    api.updateCategory(category.id, {
      title: 'Operations', sortOrder: 2,
      isActive: false, expectedVersion: category.version,
    }).subscribe();
    const cat = http.expectOne(root + '/categories/' + category.id);
    expect(cat.request.method).toBe('PUT');
    expect(cat.request.body).toEqual({
      title: 'Operations', sortOrder: 2,
      isActive: false, expectedVersion: category.version,
    });
    cat.flush(category);

    api.updateItem(item.id, {
      parentId: null, title: 'Home', icon: 'home',
      route: '/dashboard', sortOrder: 4,
      isActive: false, expectedVersion: item.version,
    }).subscribe();
    const updated = http.expectOne(root + '/items/' + item.id);
    expect(updated.request.method).toBe('PUT');
    expect(updated.request.body).not.toHaveProperty('categoryId');
    expect(updated.request.body).not.toHaveProperty('roleId');
    expect(updated.request.body.expectedVersion).toBe(item.version);
    updated.flush(item);
  });

  it('exposes 409 CAS conflicts instead of silently overwriting a stale version', () => {
    let status = 0;
    api.updateItem(item.id, {
      parentId: null, title: 'Home', icon: null,
      route: '/dashboard', sortOrder: 1,
      isActive: false, expectedVersion: item.version,
    }).subscribe({ error: e => status = e.status });
    http.expectOne(root + '/items/' + item.id).flush(
      { title: 'Conflict' }, { status: 409, statusText: 'Conflict' });
    expect(status).toBe(409);
  });
});
