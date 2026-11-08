import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface RecentTenantDto {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
}

/** Server-owned SystemAdministrator statistics; never synthesize billing. */
export interface SuperDashboardDto {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
  totalUsers: number;
  activeUsers: number;
  systemUsers: number;
  tenantUsers: number;
  totalRoles: number;
  totalPermissions: number;
  totalGroups: number;
  totalModules: number;
  recentTenants: RecentTenantDto[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl + '/system/Dashboard/super-dashboard';

  getSuperDashboard(): Observable<SuperDashboardDto> {
    return this.http.get<SuperDashboardDto>(this.url);
  }
}
