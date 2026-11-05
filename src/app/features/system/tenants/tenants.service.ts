import {  Injectable } from '@angular/core';
import { BaseService } from '../../../shared/services/base.service';



@Injectable({
    providedIn: 'root'
})
export class TenantsService extends BaseService {
    constructor(){
        super('/system/Tenants/')
    }
}

