import { HttpClient } from "@angular/common/http"
import { inject } from "@angular/core"
import { FormGroup } from "@angular/forms"
import { environment } from "../../../environments/environment";
import { GridQuery, PagedList } from "../../shared/components/grid-components";


export class BaseService {
    constructor(private _baseUrl:string){}
protected http:HttpClient=inject(HttpClient)
 protected get baseUrl(): string {
    return environment.apiUrl + this._baseUrl;
  }
      pagedList(query:GridQuery){
        return this.http.post<PagedList>(this.baseUrl+'pagedList',query,{responseType:'json'})
    }
    ChildpagedList(parentId:string,query:GridQuery){
        return this.http.post<PagedList>(this.baseUrl+parentId+'/pagedList',query,{responseType:'json'})
    }
    create(form:FormGroup){
        const model=form.getRawValue() 
       return this.http.post(this.baseUrl,model,{responseType:'json'})
    }
    update(id:string|undefined,form:FormGroup){
        const model=form.getRawValue() 
       return this.http.put(this.baseUrl+id,model,{responseType:'json'})
    }
    delete(id:string){
        return this.http.delete<void>(this.baseUrl+id)
    }
    getById(id?:string){
               return this.http.get(this.baseUrl+id,{responseType:'json'})
    }
changeState(id:string){
       return this.http.patch(this.baseUrl+id,{})
    }
}