import { AfterViewInit, Component, inject, signal, Signal } from '@angular/core';
import { DashboardService, SuperDashboardDto } from './dashboard.service';
import { CountWidgetComponent } from '../../../shared/components/count-widget/count-widget.component';


@Component({
  selector: 'app-system-dashboard.component',
  imports: [CountWidgetComponent],
  templateUrl: './system-dashboard.component.html',
  styleUrl: './system-dashboard.component.scss',
})
export class SystemDashboardComponent implements AfterViewInit {
ngAfterViewInit(): void {
  this._service.getSuperDashboard().subscribe(
    {
      next:d=>{
        this._dashboardCards.set(d)
      }
    }
  )
}
_dashboardCards=signal<SuperDashboardDto|null>({activeTenants:0,totalPermissions:0,totalRoles:0,totalTenants:0,totalUsers:0})
_service:DashboardService=inject(DashboardService)


}
