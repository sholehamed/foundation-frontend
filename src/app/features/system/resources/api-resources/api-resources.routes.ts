import { Routes } from '@angular/router';

export default [
   
     {path:'',loadComponent:()=>import('./api-resource-list/api-resource-list.component').then(x=>x.ApiResourceListComponent) ,data:{breadcrumb: ' api های  منبع'} },
     {path:'create',loadComponent:()=>import('./api-resource-form/api-resource-form.component').then(x=>x.ApiResourceFormComponent),data:{breadcrumb: ' سرویس جدید'} },
     {path:':apiResourceId/edit',loadComponent:()=>import('./api-resource-form/api-resource-form.component').then(x=>x.ApiResourceFormComponent),data:{breadcrumb: 'ویرایش سرویس'} },
    

    { path: '**', redirectTo: '/notfound' }
   ,
] as Routes;