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
