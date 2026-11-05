import { HttpClient } from "@angular/common/http"
import { Injectable, inject } from "@angular/core"
import { Observable } from "rxjs"
import { environment } from "../../../../environments/environment"

export interface SuperDashboardDto{
    totalTenants:number
    activeTenants:number
    totalUsers:number
    totalRoles:number
    totalPermissions:number
}

@Injectable({
    providedIn: 'root'
})export class DashboardService {
private http:HttpClient=inject(HttpClient)
private baseUrl=environment.apiUrl+'/system/Dashboard/'
    getSuperDashboard():Observable<SuperDashboardDto>{
        return this.http.get<SuperDashboardDto>(this.baseUrl+'super-dashboard',{responseType:'json'})
    }
}