import { HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BaseService } from "../../../../shared/services/base.service";
@Injectable({
    providedIn: 'root'
})
export class ApiResourcesService extends BaseService{
    constructor(){
        super('/System/ApiResources/')
    }
 getLookup(text?:string){
      let params = new HttpParams()
      if (text) {
    params = params.set('text', text);
  }

               return this.http.get<any[]>(this.baseUrl+'lookup',{responseType:'json',params:params})
    }
    sync(resourceId?:string){
               return this.http.patch(this.baseUrl+`${resourceId}/sync`, {})
    }
}