import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../../environments/environment';
import { SidebarMenuService } from './sidebar-menu.service';

describe('SidebarMenuService current-user navigation', () => {
  it('requests the authenticated /me endpoint without client-selected roleId', () => {
    TestBed.configureTestingModule({
      providers: [SidebarMenuService, provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(SidebarMenuService);
    const http = TestBed.inject(HttpTestingController);

    let count = -1;
    service.getMyNavigation().subscribe(x => { count = x.length; });
    const req = http.expectOne(environment.apiUrl + '/system/Menus/me');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('roleId')).toBe(false);
    expect(req.request.params.has('tenantId')).toBe(false);
    req.flush([]);
    expect(count).toBe(0);
    http.verify();
  });
});

describe('System sidebar uses live UI PAGE access when enforced', () => {
  it('hides ungranted, unregistered and external routes but keeps permitted tree items', async () => {
    const { filterSystemNavigation } = await import('./sidebar-menu.service');
    const original = [{ title: 'System', items: [
      { title: 'Roles', route: '/system/roles', childs: [] },
      { title: 'Users', route: '/system/users', childs: [] },
      { title: 'Unknown', route: '/system/unregistered', childs: [] },
      { title: 'External', externalUrl: 'https://example.test', childs: [] },
      { title: 'Container', childs: [
        { title: 'Groups', route: '/system/groups', childs: [] },
      ] },
    ] }];
    const result = filterSystemNavigation(original, {
      schemaVersion: 2,
      entries: [
        { key: 'system.roles', route: '/system/roles', type: 'PAGE', allowed: true },
        { key: 'system.users', route: '/system/users', type: 'PAGE', allowed: false },
        { key: 'system.groups', route: '/system/groups', type: 'PAGE', allowed: true },
      ],
    });
    expect(result).toHaveLength(1);
    expect(result[0].items.map(x => x.title)).toEqual(['Roles', 'Container']);
    expect(result[0].items[1].childs?.[0].title).toBe('Groups');
    expect(filterSystemNavigation(original, null)).toEqual([]);
  });
});
