import {  Injectable } from '@angular/core';
import { GridQuery, PagedList } from '../../../shared/components/grid-components';
import { BaseService } from '../../../shared/services/base.service';



@Injectable({
    providedIn: 'root'
})
export class GroupsService extends BaseService {
    constructor(){
        super('/system/Groups/')
    }
     membersPagedList(groupId:string,query:GridQuery){
            return this.http.post<PagedList>(this.baseUrl+`${groupId}/members`,query,{responseType:'json'})
        }
}

