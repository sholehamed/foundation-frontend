import {  Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { BaseService } from '../../../shared/services/base.service';



@Injectable({
    providedIn: 'root'
})
export class UsersService extends BaseService {
    constructor(){
        super('/system/Users/')
    }
    isUsernameTaken(username:string,userid?:string){
        const parameters:HttpParams=new HttpParams()
        .set('username',username)
        .set('userId',userid!)
       return this.http.get<boolean>(this.baseUrl+'isUserNameTaken',{params:parameters})
    }
    changeLockState(id:string){
       return this.http.patch(this.baseUrl+id+'/changeLock',{})
    }
}

