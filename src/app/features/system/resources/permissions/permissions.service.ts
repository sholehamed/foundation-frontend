import { Injectable } from "@angular/core";
import { HttpParams } from "@angular/common/http";
import { BaseService } from "../../../../shared/services/base.service";
@Injectable({
    providedIn: 'root'
})
export class PermissionsService extends BaseService{
    constructor(){
        super('/System/Permissions/')
    }

    getLookup(text?:string){
      let params = new HttpParams()
      if (text) {
    params = params.set('text', text);
  }

               return this.http.get<any[]>(this.baseUrl+'lookup',{responseType:'json',params:params})
    }

}