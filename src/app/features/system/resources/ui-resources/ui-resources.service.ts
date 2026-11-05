import { HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BaseService } from "../../../../shared/services/base.service";
@Injectable({
    providedIn: 'root'
})
export class UiResourcesService extends BaseService{
    constructor(){
        super('/system/UiResources/')
    }
 getLookup(text?:string){
      let params = new HttpParams()
      if (text) {
    params = params.set('text', text);
  }

               return this.http.get<any[]>(this.baseUrl+'lookup',{responseType:'json',params:params})
    }
}