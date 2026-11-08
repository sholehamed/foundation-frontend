import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { DashboardService } from './dashboard.service';

describe('DashboardService — SystemAdministrator endpoint contract', () => {
  it('calls the existing fixed protected summary URL without caller role/tenant IDs', () => {
    TestBed.configureTestingModule({ providers: [
      DashboardService, provideHttpClient(), provideHttpClientTesting(),
    ] });
    const api = TestBed.inject(DashboardService);
    const http = TestBed.inject(HttpTestingController);

    api.getSuperDashboard().subscribe();
    const request = http.expectOne(environment.apiUrl + '/system/Dashboard/super-dashboard');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual([]);
    request.flush({
      totalTenants: 0, activeTenants: 0, inactiveTenants: 0,
      totalUsers: 0, activeUsers: 0, systemUsers: 0, tenantUsers: 0,
      totalRoles: 0, totalPermissions: 0, totalGroups: 0, totalModules: 0,
      recentTenants: [],
    });
    http.verify();
  });
});
