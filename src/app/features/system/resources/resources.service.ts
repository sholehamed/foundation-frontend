import { HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BaseService } from "../../../shared/services/base.service";
@Injectable({
    providedIn: 'root'
})
export class ResourcesService extends BaseService{
    constructor(){
        super('/System/Resources/')
    }
 getLookup(text?:string){
      let params = new HttpParams()
      if (text) {
    params = params.set('text', text);
  }

               return this.http.get<any[]>(this.baseUrl+'lookup',{responseType:'json',params:params})
    }
    getgroupedLookup(resourceId:string,text?:string){
      let params = new HttpParams()
      if (text) {
    params = params.set('text', text);
  }

               return this.http.get<any[]>(this.baseUrl+resourceId+'/resources',{responseType:'json',params:params})
    }
}